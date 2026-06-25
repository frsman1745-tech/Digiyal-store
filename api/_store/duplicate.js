import { connectDB } from '../_middleware/db.js';
import { storeAuth } from '../_middleware/auth.js';
import Store from '../_models/Store.js';
import Product from '../_models/Product.js';
import QRCode from 'qrcode';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

const BASE_URL = process.env.BASE_URL || 'https://digitalstoreflyer.com';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();

  return storeAuth(req, res, async () => {
    try {
      const productId = req.query.id || req.url.split('?')[0].replace(/\/+$/, '').split('/').pop();

      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      const store = await Store.findById(req.storeId).lean();
      if (!store) return res.status(404).json({ error: 'Store not found' });

      const productCount = await Product.countDocuments({ storeId: req.storeId });
      if (productCount >= store.productLimit) {
        return res.status(403).json({
          error: `Product limit reached (${store.productLimit}). Upgrade your plan to add more products.`,
        });
      }

      const original = await Product.findOne({ _id: productId, storeId: req.storeId }).lean();
      if (!original) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const { _id, createdAt, updatedAt, qrCodeBase64, qrCodeTargetUrl, qrScanCount, ...data } = original;

      const newProduct = await Product.create({
        ...data,
        name: `${original.name} (نسخة)`,
        nameEn: original.nameEn ? `${original.nameEn} (Copy)` : '',
        isActive: false,
        qrScanCount: 0,
      });

      const storeSlug = store.slug || store._id;
      const targetUrl = `${BASE_URL}/product/${newProduct._id}?source=qr&store=${storeSlug}`;
      const qrDataUrl = await QRCode.toDataURL(targetUrl, { width: 300, margin: 2 });
      await Product.findByIdAndUpdate(newProduct._id, {
        $set: { qrCodeBase64: qrDataUrl, qrCodeTargetUrl: targetUrl },
      });

      const duplicated = await Product.findById(newProduct._id).lean();
      return res.status(201).json({ product: duplicated });
    } catch (err) {
      return res.status(500).json({ error: 'Duplicate failed', message: err.message });
    }
  });
}
