import { connectDB } from '../_middleware/db.js';
import { adminAuth } from '../_middleware/auth.js';
import { requirePermission } from '../_middleware/permissions.js';
import PlatformSettings from '../models/PlatformSettings.js';
import AdminLog from '../models/AdminLog.js';
import { getSettings } from '../models/PlatformSettings.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  return adminAuth(req, res, async () => {
    if (req.method === 'GET') {
      return requirePermission('manage_settings')(req, res, async () => {
        try {
          const settings = await getSettings();
          return res.status(200).json({ settings });
        } catch (err) {
          console.error('Get settings error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });
    }

    if (req.method === 'PUT') {
      return requirePermission('manage_settings')(req, res, async () => {
        try {
          const updates = req.body;
          const allowedFields = [
            'platformNameAr', 'platformNameEn', 'defaultPlanOnApproval',
            'defaultProductLimitOnApproval', 'maxImageSizeKB',
            'allowStoreRegistrations', 'maintenanceMode',
            'seasonalTemplates',
          ];

          const filtered = {};
          for (const key of allowedFields) {
            if (updates[key] !== undefined) {
              filtered[key] = updates[key];
            }
          }

          let settings = await PlatformSettings.findOne();
          if (!settings) {
            settings = await PlatformSettings.create(filtered);
          } else {
            await PlatformSettings.findByIdAndUpdate(settings._id, { $set: filtered });
            settings = await PlatformSettings.findById(settings._id).lean();
          }

          await AdminLog.create({
            adminId: req.adminId,
            action: 'update_settings',
            targetName: 'Platform Settings',
            details: { updatedFields: Object.keys(filtered) },
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
          });

          return res.status(200).json({ settings });
        } catch (err) {
          console.error('Update settings error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  });
}
