import { connectDB } from '../_middleware/db.js';
import { storeAuth } from '../_middleware/auth.js';
import Product from '../_models/Product.js';
import QRCode from 'qrcode';
import JSZip from 'jszip';

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
      const products = await Product.find({ storeId: req.storeId })
        .select('name nameEn qrCodeTargetUrl _id')
        .lean();

      if (!products || products.length === 0) {
        return res.status(404).json({ error: 'No products found to export' });
      }

      const zip = new JSZip();

      for (const product of products) {
        const displayName = product.nameEn || product.name || `product-${product._id}`;
        const safeName = displayName.replace(/[^a-zA-Z0-9_\u0600-\u06FF\s-]/g, '_').substring(0, 50);

        try {
          const qrBuffer = await QRCode.toBuffer(product.qrCodeTargetUrl || `${process.env.BASE_URL || 'https://digitalstoreflyer.com'}/product/${product._id}`, {
            width: 500,
            margin: 2,
            type: 'png',
          });
          zip.file(`${safeName}.png`, qrBuffer);
        } catch {
          const qrBuffer = await QRCode.toBuffer(`${process.env.BASE_URL || 'https://digitalstoreflyer.com'}/product/${product._id}`, {
            width: 500,
            margin: 2,
            type: 'png',
          });
          zip.file(`${safeName}.png`, qrBuffer);
        }
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="product-qr-codes.zip"');
      res.setHeader('Content-Length', zipBuffer.length);

      return res.status(200).send(zipBuffer);
    } catch (err) {
      return res.status(500).json({ error: 'Export failed', message: err.message });
    }
  });
}
