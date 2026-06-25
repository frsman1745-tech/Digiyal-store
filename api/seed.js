import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  name: { type: String, required: true },
  isSuperAdmin: { type: Boolean, default: false },
  role: { type: String, enum: ['super_admin', 'admin', 'moderator', 'viewer'], default: 'admin' },
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

let cached = global.mongooseSeed;
if (!cached) cached = global.mongooseSeed = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-seed-key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const seedKey = req.headers['x-seed-key'];
  if (!seedKey || seedKey !== process.env.SEED_KEY) {
    return res.status(403).json({ error: 'Forbidden: invalid seed key' });
  }

  try {
    await connectDB();

    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      name: name.trim(),
      isSuperAdmin: true,
    });

    return res.status(201).json({
      message: 'Super admin created',
      admin: { id: admin._id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    console.error('Seed error:', err);
    return res.status(500).json({ error: err.message });
  }
}
