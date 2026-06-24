import { connectDB } from '../_middleware/db.js';
import { generateToken, rateLimiter } from '../_middleware/auth.js';
import StoreAccount from '../models/StoreAccount.js';
import bcrypt from 'bcrypt';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

const loginLimiter = rateLimiter(5, 15 * 60 * 1000);

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  if (req.method === 'POST' && req.url.includes('login')) {
    return loginLimiter(req, res, async () => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password required' });
        }

        const account = await StoreAccount.findOne({ email: email.toLowerCase().trim() }).lean();
        if (!account) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!account.isActive) {
          return res.status(403).json({ error: 'Account is deactivated' });
        }

        const valid = await bcrypt.compare(password, account.passwordHash);
        if (!valid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        await StoreAccount.findByIdAndUpdate(account._id, { lastLogin: new Date() });

        const token = generateToken({ storeId: account.storeId.toString() }, 'store');

        return res.status(200).json({
          token,
          storeId: account.storeId,
          mustChangePassword: account.mustChangePassword,
        });
      } catch (err) {
        return res.status(500).json({ error: 'Server error', message: err.message });
      }
    });
  }

  if (req.method === 'POST' && req.url.includes('logout')) {
    return res.status(200).json({ message: 'Logged out successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
