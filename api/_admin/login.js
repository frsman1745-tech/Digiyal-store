import { connectDB } from '../_middleware/db.js';
import { generateToken, rateLimiter } from '../_middleware/auth.js';
import Admin from '../_models/Admin.js';
import bcrypt from 'bcryptjs';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

const loginLimiter = rateLimiter(5, 15 * 60 * 1000);

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();

  return loginLimiter(req, res, async () => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash').lean();
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const permissions = Admin.getPermissionsForRole ? Admin.getPermissionsForRole(admin.role) : [];
      const token = generateToken({ adminId: admin._id, role: admin.role }, 'admin');

      return res.status(200).json({
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          isSuperAdmin: admin.isSuperAdmin,
          role: admin.role,
          permissions,
        },
      });
    } catch (err) {
      console.error('Admin login error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}
