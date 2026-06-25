import { connectDB } from '../_middleware/db.js';
import { storeAuth } from '../_middleware/auth.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import QRCode from 'qrcode';
import axios from 'axios';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

const BASE_URL = process.env.BASE_URL || 'https://digitalstoreflyer.com';
const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION || '';

async function translateToEnglish(text) {
  if (!text || !AZURE_KEY) return text;
  if (/^[a-zA-Z0-9\s.,!?;:'"\-()]+$/.test(text)) return text;
  try {
    const headers = {
      'Ocp-Apim-Subscription-Key': AZURE_KEY,
      'Content-Type': 'application/json; charset=UTF-8',
    };
    if (AZURE_REGION) headers['Ocp-Apim-Subscription-Region'] = AZURE_REGION;

    const response = await axios.post(
      `${AZURE_ENDPOINT}/translate?api-version=3.0&from=ar&to=en`,
      [{ Text: text }],
      { headers }
    );
    return response.data?.[0]?.translations?.[0]?.text || text;
  } catch {
    return text;
  }
}

async function generateProductQR(productId, storeSlug) {
  const targetUrl = `${BASE_URL}/product/${productId}?source=qr&store=${storeSlug}`;
  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
  return { qrCodeBase64: qrDataUrl, qrCodeTargetUrl: targetUrl };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  return storeAuth(req, res, async () => {
    const productId = req.query.id;

    if (req.method === 'GET' && productId && req.url.includes('/qr')) {
      return handleGetProductQR(req, res);
    }

    if (req.method === 'GET') {
      return handleListProducts(req, res);
    }

    if (req.method === 'POST') {
      return handleCreateProduct(req, res);
    }

    if (req.method === 'PUT' && productId) {
      return handleUpdateProduct(req, res, productId);
    }

    if (req.method === 'DELETE' && productId) {
      return handleDeleteProduct(req, res, productId);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  });
}

async function handleListProducts(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const filter = { storeId: req.storeId };

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}

async function handleCreateProduct(req, res) {
  try {
    const store = await Store.findById(req.storeId).lean();
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const productCount = await Product.countDocuments({ storeId: req.storeId });
    if (productCount >= store.productLimit) {
      return res.status(403).json({
        error: `Product limit reached (${store.productLimit}). Upgrade your plan to add more products.`,
      });
    }

    const { name, nameEn, description, descriptionEn, image, price, originalPrice,
      offerStartDate, offerEndDate, category, isActive, isFeaturedOnFlyer,
      flyerPosition, section, badges, bundleDeal } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    let finalNameEn = nameEn;
    let finalDescEn = descriptionEn;

    if (!finalNameEn) {
      finalNameEn = await translateToEnglish(name);
    }
    if (!finalDescEn && description) {
      finalDescEn = await translateToEnglish(description);
    }

    const productData = {
      storeId: req.storeId,
      name: name.trim(),
      nameEn: finalNameEn || '',
      description: description || '',
      descriptionEn: finalDescEn || '',
      image: image || '',
      price: price || 0,
      originalPrice: originalPrice || null,
      offerStartDate: offerStartDate || null,
      offerEndDate: offerEndDate || null,
      category: category || '',
      isActive: isActive !== undefined ? isActive : true,
      isFeaturedOnFlyer: isFeaturedOnFlyer || false,
      flyerPosition: flyerPosition || 0,
      section: section || { sectionName: '', sectionOrder: 0 },
      badges: badges || [],
      bundleDeal: bundleDeal || {},
    };

    const product = await Product.create(productData);

    const storeSlug = store.slug || store._id;
    const qr = await generateProductQR(product._id, storeSlug);
    await Product.findByIdAndUpdate(product._id, {
      $set: { qrCodeBase64: qr.qrCodeBase64, qrCodeTargetUrl: qr.qrCodeTargetUrl },
    });

    const saved = await Product.findById(product._id).lean();
    return res.status(201).json({ product: saved });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}

async function handleUpdateProduct(req, res, productId) {
  try {
    const product = await Product.findOne({ _id: productId, storeId: req.storeId }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const updates = req.body;
    const allowedFields = [
      'name', 'nameEn', 'description', 'descriptionEn', 'image', 'imageSizeKB',
      'price', 'originalPrice', 'offerStartDate', 'offerEndDate', 'category',
      'isActive', 'isFeaturedOnFlyer', 'flyerPosition', 'section', 'badges', 'bundleDeal',
    ];

    const filtered = {};
    let needsQR = false;

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filtered[key] = updates[key];
      }
    }

    if (updates.name && !updates.nameEn) {
      filtered.nameEn = await translateToEnglish(updates.name);
    }

    await Product.findByIdAndUpdate(productId, { $set: filtered });

    if (needsQR) {
      const store = await Store.findById(req.storeId).select('slug').lean();
      const qr = await generateProductQR(productId, store.slug || store._id);
      await Product.findByIdAndUpdate(productId, {
        $set: { qrCodeBase64: qr.qrCodeBase64, qrCodeTargetUrl: qr.qrCodeTargetUrl },
      });
    }

    const updated = await Product.findById(productId).lean();
    return res.status(200).json({ product: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}

async function handleDeleteProduct(req, res, productId) {
  try {
    const product = await Product.findOne({ _id: productId, storeId: req.storeId }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (product.image && product.image.includes('cloudinary')) {
      try {
        const cloudinary = (await import('cloudinary')).v2;
        const publicId = product.image.split('/').pop().split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        }
      } catch {
        // Ignore cloudinary cleanup errors
      }
    }

    await Product.findByIdAndDelete(productId);
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}

async function handleGetProductQR(req, res, productId) {
  try {
    const productId = req.query.id;
    const product = await Product.findOne({ _id: productId, storeId: req.storeId }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const regenerate = req.query.regenerate === 'true';
    if (regenerate) {
      const store = await Store.findById(req.storeId).select('slug').lean();
      const qr = await generateProductQR(productId, store.slug || store._id);
      await Product.findByIdAndUpdate(productId, {
        $set: { qrCodeBase64: qr.qrCodeBase64, qrCodeTargetUrl: qr.qrCodeTargetUrl },
      });
      return res.status(200).json({ qrCodeBase64: qr.qrCodeBase64, qrCodeTargetUrl: qr.qrCodeTargetUrl });
    }

    return res.status(200).json({
      qrCodeBase64: product.qrCodeBase64,
      qrCodeTargetUrl: product.qrCodeTargetUrl,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}
