import { connectDB } from '../_middleware/db.js';
import Product from '../models/Product.js';
import Store from '../models/Store.js';

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

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Product ID required' });

  try {
    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (req.query.source === 'qr') {
      await Product.findByIdAndUpdate(id, { $inc: { qrScanCount: 1 } });
      await Store.findByIdAndUpdate(product.storeId, { $inc: { qrScanCount: 1 } });
    }

    return res.status(200).json({ product });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}
