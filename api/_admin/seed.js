import { connectDB } from '../_middleware/db.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-seed-key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const seedKey = req.headers['x-seed-key'];
  if (!seedKey || seedKey !== process.env.SEED_KEY) {
    return res.status(403).json({ error: 'Forbidden: invalid seed key' });
  }

  await connectDB();

  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(400).json({ error: 'Admin accounts already exist. Seed can only run when no admin accounts exist.' });
    }

    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      isSuperAdmin: true,
    });

    return res.status(201).json({
      message: 'Super admin account created successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        isSuperAdmin: admin.isSuperAdmin,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Seed error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
