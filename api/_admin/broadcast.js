import { connectDB } from '../_middleware/db.js';
import { adminAuth } from '../_middleware/auth.js';
import { requirePermission } from '../_middleware/permissions.js';
import Store from '../_models/Store.js';
import AdminLog from '../_models/AdminLog.js';
import { Resend } from 'resend';

function cors(res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();

  return adminAuth(req, res, async () => {
    return requirePermission('send_broadcast')(req, res, async () => {
      try {
        if (!resend) {
          return res.status(500).json({ error: 'Resend API key not configured' });
        }

        const { subject, htmlContent, textContent, filterPlan, filterStatus } = req.body;

        if (!subject || (!htmlContent && !textContent)) {
          return res.status(400).json({ error: 'Subject and content are required' });
        }

        const storeFilter = {};
        if (filterPlan && ['trial', 'basic', 'advanced', 'pro', 'custom'].includes(filterPlan)) {
          storeFilter.plan = filterPlan;
        }
        if (filterStatus && ['pending', 'approved', 'rejected', 'suspended'].includes(filterStatus)) {
          storeFilter.status = filterStatus;
        }

        const stores = await Store.find(storeFilter)
          .select('name contact.email')
          .lean();

        const validStores = stores.filter(s => s.contact && s.contact.email);
        const emails = validStores.map(s => s.contact.email);

        if (emails.length === 0) {
          return res.status(400).json({ error: 'No stores match the filter criteria' });
        }

        const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@digitalstoreflyer.com';
        const BATCH_SIZE = 50;
        let sent = 0;
        const errors = [];

        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
          const batch = emails.slice(i, i + BATCH_SIZE);
          try {
            await resend.batch.send(
              batch.map(email => ({
                from: fromEmail,
                to: email,
                subject,
                html: htmlContent || '',
                text: textContent || '',
              }))
            );
            sent += batch.length;
          } catch (batchErr) {
            console.error('Broadcast batch error:', batchErr);
            errors.push({ batch: i / BATCH_SIZE + 1, error: 'Batch failed' });
          }
        }

        const totalStores = validStores.length;

        await AdminLog.create({
          adminId: req.adminId,
          action: 'broadcast_email',
          targetName: `Broadcast: ${subject.substring(0, 50)}`,
          targetId: '',
          details: {
            subject,
            recipientCount: totalStores,
            sent,
            filterPlan: filterPlan || 'all',
            filterStatus: filterStatus || 'all',
            errors: errors.length > 0 ? errors : undefined,
          },
          ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
        });

        return res.status(200).json({
          message: `Email sent to ${sent}/${totalStores} stores`,
          sent,
          total: totalStores,
          errors: errors.length > 0 ? errors : undefined,
        });
      } catch (err) {
        console.error('Broadcast error:', err);
        return res.status(500).json({ error: 'Broadcast failed' });
      }
    });
  });
}
