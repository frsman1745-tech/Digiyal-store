import { connectDB } from '../_middleware/db.js';
import { adminAuth } from '../_middleware/auth.js';
import { requirePermission } from '../_middleware/permissions.js';
import AdminLog from '../_models/AdminLog.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();

  return adminAuth(req, res, async () => {
    return requirePermission('view_logs')(req, res, async () => {
      try {
        const filter = {};

        if (req.query.adminId) {
          filter.adminId = req.query.adminId;
        }
        if (req.query.action) {
          filter.action = req.query.action;
        }
        if (req.query.from || req.query.to) {
          filter.createdAt = {};
          if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
          if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
        }

        const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 200));

        const logs = await AdminLog.find(filter)
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate('adminId', 'name email')
          .lean();

        return res.status(200).json({ logs });
      } catch (err) {
        console.error('List logs error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  });
}
