import { connectDB } from '../_middleware/db.js';
import { storeAuth } from '../_middleware/auth.js';
import Store from '../models/Store.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  return storeAuth(req, res, async () => {
    if (req.method === 'GET') {
      try {
        const store = await Store.findById(req.storeId).lean();
        if (!store) return res.status(404).json({ error: 'Store not found' });
        return res.status(200).json({ store });
      } catch (err) {
        return res.status(500).json({ error: 'Server error', message: err.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        const updates = req.body;
        const allowedFields = [
          'name', 'nameEn', 'description', 'descriptionEn',
          'logo', 'coverImage', 'category',
          'location', 'contact', 'customColors',
          'latitude', 'longitude',
        ];

        const filtered = {};
        for (const key of allowedFields) {
          if (updates[key] !== undefined) {
            filtered[key] = updates[key];
          }
        }

        if (updates.slug !== undefined) {
          const currentStore = await Store.findById(req.storeId).lean();
          if (currentStore.slug && currentStore.slug !== updates.slug) {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            if (currentStore.slugLastChangedAt && currentStore.slugLastChangedAt > thirtyDaysAgo) {
              const daysLeft = Math.ceil(
                (currentStore.slugLastChangedAt.getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) /
                  (24 * 60 * 60 * 1000)
              );
              return res.status(400).json({
                error: `Slug can only be changed once every 30 days. ${daysLeft} days remaining.`,
              });
            }
          }

          const existing = await Store.findOne({
            slug: updates.slug,
            _id: { $ne: req.storeId },
          }).lean();
          if (existing) {
            return res.status(409).json({ error: 'Slug already taken' });
          }

          filtered.slug = updates.slug;
          filtered.slugLastChangedAt = new Date();
        }

        const store = await Store.findByIdAndUpdate(req.storeId, { $set: filtered }, { new: true }).lean();
        return res.status(200).json({ store });
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({ error: 'Slug already taken' });
        }
        return res.status(500).json({ error: 'Server error', message: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  });
}
