import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

let mongoAvailable = false;

// Connect to MongoDB
async function start() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      mongoAvailable = true;
      console.log('✅ MongoDB connected');
    } catch (err) {
      console.warn('⚠️ MongoDB connection failed:', err.message);
    }
  } else {
    console.warn('⚠️ MONGODB_URI not set');
  }

  // Register real API routes only if MongoDB is available
  if (mongoAvailable) {
    registerApiRoutes();
    console.log('✅ Real API routes registered');
  } else {
    setupMockRoutes();
  }

  app.listen(PORT, () => {
    console.log(`🚀 Dev API server running on http://localhost:${PORT}`);
  });
}

function registerApiRoutes() {
  const apiDir = path.join(__dirname, 'api');
  walkDir(apiDir, '');
}

function walkDir(dir, basePath) {
  const fs = require('fs');
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, `${basePath}/${entry.name}`);
    } else if (entry.name.endsWith('.js') && !entry.name.match(/^(db|auth|init)\./)) {
      const routeSuffix = entry.name.replace('.js', '').replace(/^index$/, '');
      const route = `/api${basePath}${routeSuffix ? '/' + routeSuffix : ''}`.replace(/\\/g, '/');
      const cleanRoute = route.replace(/\/+/g, '/').replace(/\/$/, '') || '/api';
      const expressRoute = cleanRoute.replace(/\[(\w+)\]/g, ':$1');
      const handlerPath = `file:///${fullPath.replace(/\\/g, '/')}`;

      registerRouteHandler(expressRoute, handlerPath);
    }
  }
}

function registerRouteHandler(route, handlerPath) {
  app.all(route, async (req, res) => {
    try {
      const mod = await import(handlerPath + '?t=' + Date.now());
      const handler = mod.default || mod.handler || mod;
      if (typeof handler === 'function') {
        // Inject mongoAvailable into req
        req.mongoAvailable = mongoAvailable;
        await handler(req, res);
      } else {
        res.status(500).json({ error: 'Invalid handler' });
      }
    } catch (err) {
      console.error('Route error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

function setupMockRoutes() {
  console.log('📦 Setting up mock API routes...');

  // Mock: POST /api/registrations
  app.post('/api/registrations', (req, res) => {
    const { storeName, ownerName, email, phone, city } = req.body;
    if (!storeName || !ownerName || !email || !phone || !city) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }
    res.status(201).json({ message: 'Registration submitted successfully (mock)', id: 'mock_' + Date.now() });
  });

  // Mock: POST /api/store/login
  app.post('/api/store/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({
      token: 'mock_token_' + Date.now(),
      store: {
        _id: 'mock_store_1',
        storeName: 'متجري التجريبي',
        ownerName: 'صاحب المتجر',
        email: email,
        city: 'دمشق',
        plan: 'free',
        status: 'active',
      },
    });
  });

  // Mock: POST /api/admin/login (used by AdminLoginPage)
  app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({
      token: 'mock_admin_token_' + Date.now(),
      admin: { _id: 'mock_admin_1', username: 'admin', email: email, role: 'super_admin', permissions: ['manage_admins', 'manage_stores', 'manage_registrations', 'manage_settings', 'view_logs', 'send_broadcast', 'manage_products', 'manage_reviews', 'view_dashboard'] },
    });
  });

  // Mock: GET /api/admin/registrations
  const mockRegistrations = [
    { _id: 'reg_1', storeName: 'متجر الإلكترونيات', ownerName: 'أحمد محمد', email: 'ahmed@test.com', phone: '0912345678', city: 'دمشق', storeType: 'electronic', message: 'نأمل الموافقة', status: 'pending', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { _id: 'reg_2', storeName: 'متجر الملابس', ownerName: 'سارة خالد', email: 'sara@test.com', phone: '0923456789', city: 'حلب', storeType: 'clothing', message: '', status: 'pending', createdAt: new Date(Date.now() - 172800000).toISOString() },
    { _id: 'reg_3', storeName: 'مخبز المعمول', ownerName: 'خالد علي', email: 'khalid@test.com', phone: '0934567890', city: 'حمص', storeType: 'food', message: 'مخبز ومعجنات', status: 'approved', createdAt: new Date(Date.now() - 259200000).toISOString() },
    { _id: 'reg_4', storeName: 'متجر الرياضة', ownerName: 'نور حسن', email: 'noor@test.com', phone: '0945678901', city: 'اللاذقية', storeType: 'sports', message: '', status: 'rejected', createdAt: new Date(Date.now() - 345600000).toISOString() },
  ];

  app.get('/api/admin/registrations', (req, res) => {
    let result = [...mockRegistrations];
    if (req.query.status && req.query.status !== 'all') {
      result = result.filter(r => r.status === req.query.status);
    }
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      result = result.filter(r =>
        r.storeName.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
      );
    }
    res.json({ registrations: result });
  });

  app.put('/api/admin/registrations/:id', (req, res) => {
    const reg = mockRegistrations.find(r => r._id === req.params.id);
    if (!reg) return res.status(404).json({ error: 'Not found' });
    if (req.body.action === 'approve') {
      reg.status = 'approved';
      reg.plan = req.body.plan || 'trial';
      const planDefaults = { trial: 10, basic: 50, advanced: 200, pro: 1000, custom: 10 };
      reg.productLimit = req.body.productLimit || planDefaults[reg.plan] || 10;
    } else if (req.body.action === 'reject') {
      reg.status = 'rejected';
    }
    res.json({ message: 'Updated', registration: reg });
  });

  // Mock: GET /api/admin/stats
  app.get('/api/admin/stats', (req, res) => {
    res.json({
      totalStores: 15,
      activeStores: 12,
      pendingRegistrations: 2,
      totalProducts: 340,
      totalFlyers: 28,
      revenue: 0,
      recentRegistrations: mockRegistrations.filter(r => r.status === 'pending').slice(0, 5),
    });
  });

  // Mock: GET /api/admin/stores
  let mockStores = [
    { _id: 'store_1', storeName: 'متجر الإلكترونيات', email: 'ahmed@store.com', city: 'دمشق', plan: 'free', status: 'active', isFeatured: false, createdAt: '2026-01-15T10:00:00Z', productsCount: 45 },
    { _id: 'store_2', storeName: 'متجر الملابس', email: 'sara@store.com', city: 'حلب', plan: 'premium', status: 'active', isFeatured: true, createdAt: '2026-02-20T10:00:00Z', productsCount: 120 },
    { _id: 'store_3', storeName: 'مخبز المعمول', email: 'khalid@store.com', city: 'حمص', plan: 'free', status: 'suspended', isFeatured: false, createdAt: '2026-03-10T10:00:00Z', productsCount: 8 },
  ];

  app.get('/api/admin/stores', (req, res) => {
    let result = [...mockStores];
    if (req.query.status && req.query.status !== 'all') {
      result = result.filter(s => s.status === req.query.status);
    }
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      result = result.filter(s => s.storeName.toLowerCase().includes(q));
    }
    res.json({ stores: result, total: result.length });
  });

  app.get('/api/admin/stores/:id', (req, res) => {
    const store = mockStores.find(s => s._id === req.params.id);
    if (!store) return res.status(404).json({ error: 'Not found' });
    res.json({
      ...store,
      description: 'متجر إلكتروني متكامل يقدم أفضل المنتجات',
      contact: { email: store.email, phone: '0912345678', whatsapp: '0912345678' },
      location: { city: store.city, area: 'المركز', address: 'شارع ١' },
      category: 'supermarket',
      storageUsedMB: 50,
      productCount: store.productsCount || 0,
      rating: 4.2,
    });
  });

  app.put('/api/admin/stores/:id', (req, res) => {
    const store = mockStores.find(s => s._id === req.params.id);
    if (!store) return res.status(404).json({ error: 'Not found' });
    Object.assign(store, req.body);
    res.json({ message: 'Updated', store });
  });

  app.delete('/api/admin/stores/:id', (req, res) => {
    mockStores = mockStores.filter(s => s._id !== req.params.id);
    res.json({ message: 'Deleted' });
  });

  // Mock: GET/PUT /api/admin/settings
  let mockSettings = {
    allowStoreRegistrations: true,
    defaultPlan: 'free',
    siteName: 'Digital Store Flyer',
    supportEmail: 'support@example.com',
    maxProductsFree: 50,
    maxProductsPremium: 500,
    storageLimitFree: 100,
    storageLimitPremium: 1000,
  };

  app.get('/api/admin/settings', (req, res) => res.json(mockSettings));
  app.put('/api/admin/settings', (req, res) => {
    Object.assign(mockSettings, req.body);
    res.json({ message: 'Settings updated', settings: mockSettings });
  });

  // Mock: GET /api/admin/logs
  app.get('/api/admin/logs', (req, res) => {
    const logs = Array.from({ length: 25 }, (_, i) => ({
      _id: `log_${i}`,
      action: ['store_approved', 'store_rejected', 'store_created', 'admin_login', 'settings_updated'][i % 5],
      adminId: 'mock_admin_1',
      adminName: 'admin',
      target: `target_${i}`,
      details: `تفاصيل الإجراء رقم ${i + 1}`,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));
    res.json({ logs, total: 25 });
  });

  // Mock: GET /api/admin/broadcast/preview and POST /api/admin/broadcast
  app.get('/api/admin/broadcast/preview', (req, res) => {
    res.json({
      preview: 'هذه رسالة تجريبية سترسل إلى ' + (req.query.target || 'الجميع'),
      recipientCount: 12,
    });
  });

  app.post('/api/admin/broadcast', (req, res) => {
    res.json({ message: 'Broadcast sent successfully', sentCount: 12 });
  });

  // Mock: GET /api/admin/admins
  let mockAdmins = [
    { _id: 'admin_1', name: 'المشرف العام', email: 'super@admin.com', role: 'super_admin', createdAt: '2026-01-01T00:00:00Z' },
    { _id: 'admin_2', name: 'أحمد المشرف', email: 'ahmed@admin.com', role: 'admin', createdAt: '2026-02-15T00:00:00Z' },
    { _id: 'admin_3', name: 'مشرف مساعد', email: 'mod@admin.com', role: 'moderator', createdAt: '2026-03-20T00:00:00Z' },
  ];

  app.get('/api/admin/admins', (req, res) => {
    res.json({ admins: mockAdmins });
  });

  app.post('/api/admin/admins', (req, res) => {
    const { email, name, password, role } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }
    const newAdmin = { _id: 'admin_' + Date.now(), name, email, role: role || 'admin', createdAt: new Date().toISOString() };
    mockAdmins.unshift(newAdmin);
    res.status(201).json({ message: 'Admin created', admin: newAdmin });
  });

  app.put('/api/admin/admins', (req, res) => {
    const admin = mockAdmins.find(a => a._id === req.query.id);
    if (!admin) return res.status(404).json({ error: 'Not found' });
    if (req.body.role) admin.role = req.body.role;
    if (req.body.name) admin.name = req.body.name;
    res.json({ message: 'Admin updated', admin });
  });

  app.delete('/api/admin/admins', (req, res) => {
    mockAdmins = mockAdmins.filter(a => a._id !== req.query.id);
    res.json({ message: 'Admin deleted' });
  });

  // Mock: GET /api/admin/products
  let mockProducts = [
    { _id: 'prod_1', name: 'منتج ١', nameEn: 'Product 1', image: null, price: 49.99, isActive: true, storeId: { _id: 'store_1', name: 'متجر الإلكترونيات' }, createdAt: '2026-04-01T10:00:00Z' },
    { _id: 'prod_2', name: 'منتج ٢', nameEn: 'Product 2', image: null, price: 99.99, isActive: true, storeId: { _id: 'store_2', name: 'متجر الملابس' }, createdAt: '2026-04-05T10:00:00Z' },
    { _id: 'prod_3', name: 'منتج ٣', nameEn: 'Product 3', image: null, price: 29.99, isActive: false, storeId: { _id: 'store_1', name: 'متجر الإلكترونيات' }, createdAt: '2026-03-20T10:00:00Z' },
  ];

  app.get('/api/admin/products', (req, res) => {
    let result = [...mockProducts];
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q));
    }
    res.json({ products: result, total: result.length, page: 1, pages: 1 });
  });

  app.delete('/api/admin/products', (req, res) => {
    mockProducts = mockProducts.filter(p => p._id !== req.query.id);
    res.json({ message: 'Product deleted' });
  });

  // Mock: GET /api/admin/reviews
  let mockReviews = [
    { _id: 'rev_1', userName: 'أحمد', rating: 5, comment: 'متجر رائع جداً', storeId: { _id: 'store_1', name: 'متجر الإلكترونيات' }, createdAt: '2026-05-01T10:00:00Z' },
    { _id: 'rev_2', userName: 'سارة', rating: 4, comment: 'منتجات جميلة', storeId: { _id: 'store_2', name: 'متجر الملابس' }, createdAt: '2026-05-10T10:00:00Z' },
    { _id: 'rev_3', userName: 'خالد', rating: 3, comment: 'متوسط', storeId: { _id: 'store_1', name: 'متجر الإلكترونيات' }, createdAt: '2026-05-15T10:00:00Z' },
  ];

  app.get('/api/admin/reviews', (req, res) => {
    let result = [...mockReviews];
    if (req.query.storeId) result = result.filter(r => r.storeId._id === req.query.storeId);
    res.json({ reviews: result, total: result.length, page: 1, pages: 1 });
  });

  app.delete('/api/admin/reviews', (req, res) => {
    mockReviews = mockReviews.filter(r => r._id !== req.query.id);
    res.json({ message: 'Review deleted' });
  });

  // Mock: GET /api/admin/flyers
  app.get('/api/admin/flyers', (req, res) => {
    const flyers = [
      { _id: 'fly_1', storeId: { _id: 'store_1', name: 'متجر الإلكترونيات' }, status: 'active', startDate: '2026-06-01T00:00:00Z', endDate: '2026-06-30T00:00:00Z', products: [1, 2, 3], createdAt: '2026-05-25T10:00:00Z' },
      { _id: 'fly_2', storeId: { _id: 'store_2', name: 'متجر الملابس' }, status: 'scheduled', startDate: '2026-07-01T00:00:00Z', endDate: '2026-07-15T00:00:00Z', products: [1], createdAt: '2026-06-20T10:00:00Z' },
    ];
    let result = [...flyers];
    if (req.query.status) result = result.filter(f => f.status === req.query.status);
    res.json({ flyers: result, total: result.length, page: 1, pages: 1 });
  });

  // Mock: GET /api/public/stores
  app.get('/api/public/stores', (req, res) => {
    res.json({
      stores: [
        { _id: 'mock_1', storeName: 'المتجر الأول', city: 'دمشق', storeType: 'electronic', status: 'active', logo: null, description: 'متجر إلكتروني متكامل' },
        { _id: 'mock_2', storeName: 'المتجر الثاني', city: 'حلب', storeType: 'clothing', status: 'active', logo: null, description: 'متجر ملابس عصري' },
        { _id: 'mock_3', storeName: 'المتجر الثالث', city: 'حمص', storeType: 'food', status: 'active', logo: null, description: 'متجر مواد غذائية' },
      ],
    });
  });

  // Mock: GET /api/public/stores/:id
  app.get('/api/public/stores/:id', (req, res) => {
    res.json({
      _id: req.params.id,
      storeName: 'المتجر',
      city: 'دمشق',
      storeType: 'electronic',
      status: 'active',
      description: 'وصف المتجر',
    });
  });

  // Mock: GET /api/public/products
  app.get('/api/public/products', (req, res) => {
    res.json({ products: [] });
  });

  // Mock: GET /api/public/flyers
  app.get('/api/public/flyers', (req, res) => {
    res.json({ flyers: [] });
  });

  // Mock: GET /api/public/featured
  app.get('/api/public/featured', (req, res) => {
    res.json({
      featuredStores: [],
      featuredProducts: [],
      activeFlyers: [],
    });
  });

  console.log('✅ Mock routes registered (MongoDB unavailable)');
}

start();
