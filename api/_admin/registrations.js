import { connectDB } from '../_middleware/db.js';
import { adminAuth } from '../_middleware/auth.js';
import { requirePermission } from '../_middleware/permissions.js';
import StoreRegistration from '../_models/StoreRegistration.js';
import Store from '../_models/Store.js';
import StoreAccount from '../_models/StoreAccount.js';
import AdminLog from '../_models/AdminLog.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';

function cors(res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function generatePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  return adminAuth(req, res, async () => {
    if (req.method === 'GET') {
      return requirePermission('manage_registrations')(req, res, () => handleListRegistrations(req, res));
    }

    if (req.method === 'PUT') {
      const regId = req.query.id;
      if (!regId) return res.status(400).json({ error: 'Registration ID required' });
      return requirePermission('manage_registrations')(req, res, () => handleUpdateRegistration(req, res, regId));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  });
}

async function handleListRegistrations(req, res) {
  try {
    const status = req.query.status || '';
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));

    const total = await StoreRegistration.countDocuments(filter);
    const registrations = await StoreRegistration.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('reviewedBy', 'name email')
      .lean();

    return res.status(200).json({
      registrations,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('List registrations error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleUpdateRegistration(req, res, regId) {
  try {
    const registration = await StoreRegistration.findById(regId);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const { action, adminNote, plan, productLimit, monthlyPrice, storeName, sendEmail, password: manualPassword } = req.body;

    if (action === 'approve') {
      registration.status = 'approved';
      registration.adminNote = adminNote || '';
      registration.reviewedAt = new Date();
      registration.reviewedBy = req.adminId;
      if (storeName) registration.storeName = storeName;
      await registration.save();

      if (manualPassword) {
        const trimmed = manualPassword.trim();
        if (trimmed.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        if (trimmed.length > 128) {
          return res.status(400).json({ error: 'Password too long (max 128 characters)' });
        }
      }
      const password = manualPassword ? manualPassword.trim() : generatePassword();
      const passwordHash = await bcrypt.hash(password, 12);

      const selectedPlan = plan || 'trial';
      const planDefaults = { trial: 10, basic: 50, advanced: 200, pro: 1000, custom: 10 };
      const finalLimit = productLimit || planDefaults[selectedPlan] || 10;

      let slug = slugify(registration.storeName);
      let existingSlug = await Store.findOne({ slug }).lean();
      let counter = 1;
      while (existingSlug) {
        slug = `${slugify(registration.storeName)}-${counter}`;
        existingSlug = await Store.findOne({ slug }).lean();
        counter++;
      }

      const store = await Store.create({
        name: registration.storeName,
        slug,
        'contact.email': registration.email,
        'contact.phone': registration.phone,
        'location.city': registration.city,
        category: registration.storeType || 'other',
        status: 'approved',
        plan: selectedPlan,
        productLimit: finalLimit,
        monthlyPrice: monthlyPrice || 0,
      });

      await StoreAccount.create({
        storeId: store._id,
        email: registration.email,
        passwordHash,
        mustChangePassword: true,
      });

      if (resend && sendEmail !== false) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@digitalstoreflyer.com',
            to: registration.email,
            subject: 'تم الموافقة على طلب تسجيل متجرك',
            html: `
              <div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:auto;">
                <h2>تم الموافقة على طلبك!</h2>
                <p>مرحباً ${registration.ownerName}،</p>
                <p>تمت الموافقة على طلب تسجيل متجر <strong>${registration.storeName}</strong>.</p>
                <p>يمكنك الآن تسجيل الدخول باستخدام البيانات التالية:</p>
                <p><strong>البريد الإلكتروني:</strong> ${registration.email}</p>
                <p><strong>كلمة المرور:</strong> ${password}</p>
                <p>ننصحك بتغيير كلمة المرور بعد أول تسجيل دخول.</p>
                <br/>
                <p>شكراً لانضمامك إلينا!</p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error('Failed to send approval email:', emailErr);
        }
      }

      await AdminLog.create({
        adminId: req.adminId,
        action: 'approve_registration',
        targetId: registration._id.toString(),
        targetName: registration.storeName,
        details: { email: registration.email, storeId: store._id.toString() },
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
      });

      return res.status(200).json({
        message: 'Registration approved',
        storeId: store._id,
        email: registration.email,
        plan: selectedPlan,
        productLimit: finalLimit,
      });
    }

    if (action === 'reject') {
      registration.status = 'rejected';
      registration.adminNote = adminNote || '';
      registration.reviewedAt = new Date();
      registration.reviewedBy = req.adminId;
      await registration.save();

      if (resend) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@digitalstoreflyer.com',
            to: registration.email,
            subject: 'نأسف، لم تتم الموافقة على طلب تسجيل متجرك',
            html: `
              <div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:auto;">
                <h2>نأسف لرفض طلبك</h2>
                <p>مرحباً ${registration.ownerName}،</p>
                <p>نأسف لإبلاغك أنه لم تتم الموافقة على طلب تسجيل متجر <strong>${registration.storeName}</strong>.</p>
                ${adminNote ? `<p>ملاحظة المشرف: ${adminNote}</p>` : ''}
                <p>يمكنك التواصل معنا للحصول على مزيد من المعلومات.</p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error('Failed to send rejection email:', emailErr);
        }
      }

      await AdminLog.create({
        adminId: req.adminId,
        action: 'reject_registration',
        targetId: registration._id.toString(),
        targetName: registration.storeName,
        details: { email: registration.email, note: adminNote },
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
      });

      return res.status(200).json({ message: 'Registration rejected' });
    }

    return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject".' });
  } catch (err) {
    console.error('Update registration error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
