import { connectDB } from '../_middleware/db.js';
import Product from '../_models/Product.js';
import Store from '../_models/Store.js';

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
  const urlParts = req.url.split('?')[0].replace(/\/+$/, '').split('/');
  const resourceIdx = urlParts.indexOf('products');
  const idFromPath = resourceIdx !== -1 && urlParts.length > resourceIdx + 1 ? urlParts[resourceIdx + 1] : null;
  const productId = id || idFromPath;
  if (!productId) return res.status(400).json({ error: 'Product ID required' });

  try {
    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (req.query.source === 'qr') {
      await Product.findByIdAndUpdate(productId, { $inc: { qrScanCount: 1 } });
      await Store.findByIdAndUpdate(product.storeId, { $inc: { qrScanCount: 1 } });
    }

    return res.status(200).json({ product });
  } catch (err) {
    console.error('Public products error:', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}
