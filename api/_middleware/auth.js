import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { connectDB } from './db.js';
import Store from '../_models/Store.js';
import Admin from '../_models/Admin.js';

const JWT_SECRET = process.env.JWT_SECRET;
const HMAC_KEY = process.env.HMAC_KEY || JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === 'your-64-char-random-string-here-change-in-production') {
  console.warn('WARNING: JWT_SECRET is not set or is the default placeholder. Set it in production.');
}

const rateLimitStore = new Map();

export function generateToken(payload, role = 'store') {
  return jwt.sign({ ...payload, role }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function storeAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded.role !== 'store') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await connectDB();
    const store = await Store.findById(decoded.storeId).lean();
    if (!store || store.status === 'suspended') {
      return res.status(403).json({ error: 'Store suspended or not found' });
    }
    req.storeId = decoded.storeId;
    req.store = store;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function adminAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await connectDB();
    const admin = await Admin.findById(decoded.adminId).select('+passwordHash').lean();
    if (!admin) {
      return res.status(403).json({ error: 'Admin not found' });
    }
    const permissions = Admin.getPermissionsForRole ? Admin.getPermissionsForRole(admin.role) : [];
    req.adminId = decoded.adminId;
    req.admin = { ...admin, permissions };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function rateLimiter(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    const entry = rateLimitStore.get(key);
    if (now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return res.status(429).json({
        error: 'Too many attempts',
        retryAfter,
      });
    }

    next();
  };
}

export function hmacSign(data) {
  return crypto
    .createHmac('sha256', HMAC_KEY)
    .update(typeof data === 'string' ? data : JSON.stringify(data))
    .digest('hex');
}

export function hmacVerify(data, signature) {
  const expected = hmacSign(data);
  if (!signature || !expected) return false;
  const bufSig = Buffer.from(signature);
  const bufExp = Buffer.from(expected);
  if (bufSig.length !== bufExp.length) return false;
  return crypto.timingSafeEqual(bufSig, bufExp);
}
