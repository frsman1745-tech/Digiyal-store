import { connectDB } from '../_middleware/db.js';
import { adminAuth } from '../_middleware/auth.js';
import { requirePermission } from '../_middleware/permissions.js';
import Store from '../_models/Store.js';
import StoreAccount from '../_models/StoreAccount.js';
import Product from '../_models/Product.js';
import Flyer from '../_models/Flyer.js';
import AdminLog from '../_models/AdminLog.js';
import bcrypt from 'bcryptjs';

function cors(res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function slugify(text) {
  return text
    .toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  return adminAuth(req, res, async () => {
    const urlParts = req.url.split('?')[0].replace(/\/+$/, '').split('/');
    const resourceIdx = urlParts.indexOf('stores');
    const idFromPath = resourceIdx !== -1 && urlParts.length > resourceIdx + 1 ? urlParts[resourceIdx + 1] : null;
    const storeId = req.query.id || idFromPath;

    if (req.method === 'GET') {
      if (!storeId) {
        return requirePermission('manage_stores')(req, res, () => handleListStores(req, res));
      }
      return requirePermission('manage_stores')(req, res, () => handleGetStore(req, res, storeId));
    }

    if (req.method === 'POST') {
      return requirePermission('manage_stores')(req, res, () => handleCreateStore(req, res));
    }

    if (!storeId) return res.status(400).json({ error: 'Store ID required' });

    if (req.method === 'PUT') {
      return requirePermission('manage_stores')(req, res, () => handleUpdateStore(req, res, storeId));
    }

    if (req.method === 'DELETE') {
      return requirePermission('manage_stores')(req, res, () => handleDeleteStore(req, res, storeId));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  });
}

async function handleListStores(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const status = req.query.status || '';
    const search = req.query.search || '';
    const plan = req.query.plan || '';

    const filter = {};
    if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      filter.status = status;
    }
    if (plan && ['trial', 'basic', 'advanced', 'pro', 'custom'].includes(plan)) {
      filter.plan = plan;
    }
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ name: regex }, { nameEn: regex }, { 'contact.email': regex }, { slug: regex }];
    }

    const total = await Store.countDocuments(filter);
    const stores = await Store.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const storeIds = stores.map(s => s._id);
    const productCounts = await Product.aggregate([
      { $match: { storeId: { $in: storeIds } } },
      { $group: { _id: '$storeId', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    productCounts.forEach(p => { countMap[p._id.toString()] = p.count; });

    const storesWithStats = stores.map(s => ({
      ...s,
      productCount: countMap[s._id.toString()] || 0,
    }));

    return res.status(200).json({
      stores: storesWithStats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('List stores error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetStore(req, res, storeId) {
  try {
    const store = await Store.findById(storeId).lean();
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const productCount = await Product.countDocuments({ storeId });
    const flyerCount = await Flyer.countDocuments({ storeId });

    return res.status(200).json({
      ...store,
      productCount,
      flyerCount,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateStore(req, res) {
  try {
    const { name, nameEn, email, password, plan, productLimit, category, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    let slug = slugify(name);
    let existingSlug = await Store.findOne({ slug }).lean();
    let counter = 1;
    while (existingSlug) {
      slug = `${slugify(name)}-${counter}`;
      existingSlug = await Store.findOne({ slug }).lean();
      counter++;
    }

    const existingEmail = await StoreAccount.findOne({ email: email.toLowerCase().trim() }).lean();
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const store = await Store.create({
      name: name.trim(),
      nameEn: nameEn || '',
      slug,
      'contact.email': email.toLowerCase().trim(),
      'location.city': city || '',
      category: category || 'other',
      status: 'approved',
      plan: plan || 'trial',
      productLimit: productLimit || 10,
    });

    const passwordHash = await bcrypt.hash(password, 12);
    await StoreAccount.create({
      storeId: store._id,
      email: email.toLowerCase().trim(),
      passwordHash,
      mustChangePassword: true,
    });

    await AdminLog.create({
      adminId: req.adminId,
      action: 'create_store',
      targetId: store._id.toString(),
      targetName: store.name,
      details: { email },
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
    });

    return res.status(201).json({ message: 'Store created successfully', storeId: store._id });
  } catch (err) {
    console.error('Create store error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleUpdateStore(req, res, storeId) {
  try {
    const updates = req.body;
    const allowedFields = [
      'name', 'nameEn', 'status', 'isFeatured', 'featuredOrder', 'plan',
      'productLimit', 'monthlyPrice', 'category', 'customColors', 'slug',
      'selectedTemplate', 'suspendReason', 'suspendedAt',
    ];

    const filtered = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filtered[key] = updates[key];
      }
    }

    const store = await Store.findByIdAndUpdate(storeId, { $set: filtered }, { new: true, runValidators: true }).lean();
    if (!store) return res.status(404).json({ error: 'Store not found' });

    await AdminLog.create({
      adminId: req.adminId,
      action: 'update_store',
      targetId: storeId,
      targetName: store.name,
      details: { updates: Object.keys(filtered) },
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
    });

    return res.status(200).json({ store });
  } catch (err) {
    console.error('Update store error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Slug already taken' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDeleteStore(req, res, storeId) {
  try {
    const store = await Store.findById(storeId).lean();
    if (!store) return res.status(404).json({ error: 'Store not found' });

    await Store.findByIdAndUpdate(storeId, {
      $set: { status: 'suspended' },
    });

    await StoreAccount.updateMany({ storeId }, { $set: { isActive: false } });

    await AdminLog.create({
      adminId: req.adminId,
      action: 'suspend_store',
      targetId: storeId,
      targetName: store.name,
      details: {},
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
    });

    return res.status(200).json({ message: 'Store suspended successfully' });
  } catch (err) {
    console.error('Suspend store error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
