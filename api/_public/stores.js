import { connectDB } from '../_middleware/db.js';
import Store from '../_models/Store.js';
import Product from '../_models/Product.js';
import Flyer from '../_models/Flyer.js';

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

  const pathParts = req.url.split('?')[0].replace(/\/+$/, '').split('/');
  const secondLast = pathParts[pathParts.length - 2];
  const lastPath = pathParts[pathParts.length - 1];
  const { id } = req.query;
  const storeId = id || lastPath;

  if (storeId && secondLast === 'stores' && lastPath === 'products') {
    req.query.id = storeId;
    return handleStoreProducts(req, res);
  }

  if (storeId && secondLast === 'stores') {
    req.query.id = storeId;
    return handleStoreDetail(req, res);
  }

  return handleStoreList(req, res);
}

async function handleStoreList(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search || '';
    const category = req.query.category || '';
    const sort = req.query.sort || '-featuredOrder';
    const city = req.query.city || '';

    const filter = { status: 'approved' };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { nameEn: regex },
        { description: regex },
        { 'location.city': regex },
        { 'location.area': regex },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }

    const sortObj = {};
    if (sort === '-featuredOrder') {
      sortObj.isFeatured = -1;
      sortObj.featuredOrder = 1;
      sortObj.rating = -1;
    } else if (sort === 'rating') {
      sortObj.rating = -1;
    } else if (sort === 'newest') {
      sortObj.createdAt = -1;
    } else {
      sortObj.isFeatured = -1;
      sortObj.featuredOrder = 1;
    }

    const total = await Store.countDocuments(filter);
    const stores = await Store.find(filter)
      .select('-storeQrCodeBase64 -slugLastChangedAt')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      stores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}

async function handleStoreDetail(req, res) {
  try {
    const { id } = req.query;

    let store = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      store = await Store.findById(id).lean();
    }
    if (!store) {
      store = await Store.findOne({ slug: id }).lean();
    }
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    await Store.findByIdAndUpdate(store._id, { $inc: { flyerViewCount: 1 } });

    const activeFlyer = await Flyer.findOne({
      storeId: store._id,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }).lean();

    return res.status(200).json({
      store,
      activeFlyer: activeFlyer
        ? {
            _id: activeFlyer._id,
            templateId: activeFlyer.templateId,
            startDate: activeFlyer.startDate,
            endDate: activeFlyer.endDate,
            productCount: activeFlyer.products ? activeFlyer.products.length : 0,
          }
        : null,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}

async function handleStoreProducts(req, res) {
  try {
    const { id } = req.query;

    let store = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      store = await Store.findById(id).lean();
    }
    if (!store) {
      store = await Store.findOne({ slug: id }).lean();
    }
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const activeFlyer = await Flyer.findOne({
      storeId: store._id,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }).select('products templateId').lean();

    const products = await Product.find({
      storeId: store._id,
      isActive: true,
      $or: [
        { offerEndDate: { $gte: new Date() } },
        { offerEndDate: null },
      ],
    }).sort({ isFeaturedOnFlyer: -1, flyerPosition: 1, createdAt: -1 }).lean();

    return res.status(200).json({
      products,
      flyer: activeFlyer || null,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}
