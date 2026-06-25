import { connectDB } from '../_middleware/db.js';
import { adminAuth } from '../_middleware/auth.js';
import { requirePermission } from '../_middleware/permissions.js';
import Product from '../_models/Product.js';
import Store from '../_models/Store.js';

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
      return requirePermission('manage_products')(req, res, async () => {
        try {
          const { search, storeId, page = 1, limit = 50 } = req.query;
          const filter = {};
          if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
              { name: { $regex: escaped, $options: 'i' } },
              { nameEn: { $regex: escaped, $options: 'i' } },
            ];
          }
          if (storeId) filter.storeId = storeId;

          const skip = (parseInt(page) - 1) * parseInt(limit);
          const products = await Product.find(filter)
            .populate('storeId', 'name slug')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
          const total = await Product.countDocuments(filter);

          return res.status(200).json({ products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
        } catch (err) {
          console.error('List products error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });
    }

    if (req.method === 'DELETE') {
      return requirePermission('manage_products')(req, res, async () => {
        try {
          const { id } = req.query;
          const idFromPath = req.url.split('?')[0].replace(/\/+$/, '').split('/').pop();
          const productId = id || idFromPath;
          if (!productId) return res.status(400).json({ error: 'Product ID required' });
          const product = await Product.findByIdAndDelete(productId);
          if (!product) return res.status(404).json({ error: 'Product not found' });
          return res.status(200).json({ message: 'Product deleted' });
        } catch (err) {
          console.error('Delete product error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  });
}
