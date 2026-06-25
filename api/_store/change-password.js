import { connectDB } from '../_middleware/db.js';
import { storeAuth } from '../_middleware/auth.js';
import StoreAccount from '../_models/StoreAccount.js';
import bcrypt from 'bcryptjs';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();

  return storeAuth(req, res, async () => {
    try {
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await StoreAccount.findOneAndUpdate(
        { storeId: req.storeId },
        { $set: { passwordHash, mustChangePassword: false } },
      );

      return res.status(200).json({ message: 'Password changed successfully' });
    } catch (err) {
      return res.status(500).json({ error: 'Server error', message: err.message });
    }
  });
}
