import { connectDB } from '../_middleware/db.js';
import { adminAuth } from '../_middleware/auth.js';
import { requirePermission } from '../_middleware/permissions.js';
import Review from '../models/Review.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  return adminAuth(req, res, async () => {
    if (req.method === 'GET') {
      return requirePermission('manage_reviews')(req, res, async () => {
        try {
          const { storeId, page = 1, limit = 50 } = req.query;
          const filter = {};
          if (storeId) filter.storeId = storeId;

          const skip = (parseInt(page) - 1) * parseInt(limit);
          const reviews = await Review.find(filter)
            .populate('storeId', 'name slug')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
          const total = await Review.countDocuments(filter);

          return res.status(200).json({ reviews, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
        } catch (err) {
          console.error('List reviews error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });
    }

    if (req.method === 'DELETE') {
      return requirePermission('manage_reviews')(req, res, async () => {
        try {
          const { id } = req.query;
          if (!id) return res.status(400).json({ error: 'Review ID required' });
          const review = await Review.findByIdAndDelete(id);
          if (!review) return res.status(404).json({ error: 'Review not found' });
          return res.status(200).json({ message: 'Review deleted' });
        } catch (err) {
          console.error('Delete review error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  });
}
