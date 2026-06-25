import { connectDB } from '../_middleware/db.js';
import { storeAuth } from '../_middleware/auth.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();

  return storeAuth(req, res, async () => {
    try {
      const store = await Store.findById(req.storeId).select('productLimit storageUsedMB plan').lean();
      const productCount = await Product.countDocuments({ storeId: req.storeId });
      const activeProductCount = await Product.countDocuments({
        storeId: req.storeId,
        isActive: true,
        offerEndDate: { $gte: new Date() },
      });

      return res.status(200).json({
        productsUsed: productCount,
        productLimit: store.productLimit,
        productsRemaining: Math.max(0, store.productLimit - productCount),
        activeProducts: activeProductCount,
        storageUsedMB: store.storageUsedMB || 0,
        plan: store.plan,
        usagePercent: store.productLimit > 0
          ? Math.round((productCount / store.productLimit) * 100)
          : 0,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Server error', message: err.message });
    }
  });
}
