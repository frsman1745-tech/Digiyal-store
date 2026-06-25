import { connectDB } from '../_middleware/db.js';
import { adminAuth } from '../_middleware/auth.js';
import { requireSuperAdmin } from '../_middleware/permissions.js';
import Admin from '../_models/Admin.js';
import bcrypt from 'bcryptjs';

function cors(res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  return adminAuth(req, res, async () => {
    if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (req.method === 'GET') {
      try {
        const admins = await Admin.find({}).select('-passwordHash').sort({ createdAt: -1 }).lean();
        return res.status(200).json({ admins });
      } catch (err) {
        console.error('List admins error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    return requireSuperAdmin(req, res, async () => {
      if (req.method === 'POST') {
        try {
          const { email, name, password, role } = req.body;
          if (!email || !name || !password) {
            return res.status(400).json({ error: 'Email, name, and password are required' });
          }
          const exists = await Admin.findOne({ email: email.toLowerCase().trim() });
          if (exists) {
            return res.status(409).json({ error: 'Admin with this email already exists' });
          }
          const passwordHash = await bcrypt.hash(password, 10);
          const admin = await Admin.create({
            email: email.toLowerCase().trim(),
            name,
            passwordHash,
            role: role || 'admin',
          });
          return res.status(201).json({
            message: 'Admin created',
            admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
          });
        } catch (err) {
          console.error('Create admin error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
      }

      if (req.method === 'PUT') {
        try {
          const { id } = req.query;
          if (!id) return res.status(400).json({ error: 'Admin ID required' });
          if (id === req.adminId.toString()) {
            return res.status(400).json({ error: 'Cannot change your own role' });
          }
          const { role, name } = req.body;
          const update = {};
          if (role) update.role = role;
          if (name) update.name = name;
          const admin = await Admin.findByIdAndUpdate(id, update, { new: true }).select('-passwordHash');
          if (!admin) return res.status(404).json({ error: 'Admin not found' });
          return res.status(200).json({ message: 'Admin updated', admin });
        } catch (err) {
          console.error('Update admin error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
      }

      if (req.method === 'DELETE') {
        try {
          const { id } = req.query;
          if (!id) return res.status(400).json({ error: 'Admin ID required' });
          if (id === req.adminId.toString()) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
          }
          const admin = await Admin.findByIdAndDelete(id);
          if (!admin) return res.status(404).json({ error: 'Admin not found' });
          return res.status(200).json({ message: 'Admin deleted' });
        } catch (err) {
          console.error('Delete admin error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
      }
    });
  });
}
