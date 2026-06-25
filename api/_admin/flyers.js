import { connectDB } from '../_middleware/db.js';
import { adminAuth } from '../_middleware/auth.js';
import { requirePermission } from '../_middleware/permissions.js';
import Flyer from '../_models/Flyer.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  return adminAuth(req, res, async () => {
    if (req.method === 'GET') {
      return requirePermission('manage_flyers')(req, res, async () => {
        try {
          const { status, page = 1, limit = 50 } = req.query;
          const filter = {};
          if (status) filter.status = status;

          const skip = (parseInt(page) - 1) * parseInt(limit);
          const flyers = await Flyer.find(filter)
            .populate('storeId', 'name slug logo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
          const total = await Flyer.countDocuments(filter);

          return res.status(200).json({ flyers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
        } catch (err) {
          console.error('List flyers error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  });
}
