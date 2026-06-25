import { connectDB } from '../_middleware/db.js';
import { storeAuth } from '../_middleware/auth.js';
import Store from '../_models/Store.js';
import Flyer from '../_models/Flyer.js';

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
        const flyers = await Flyer.find({ storeId: req.storeId })
          .sort({ createdAt: -1 })
          .populate('products', 'name nameEn price image isActive')
          .lean();

        const currentFlyer = flyers.find(f => f.status === 'active');
        return res.status(200).json({ flyers, currentFlyer });
      } catch (err) {
        return res.status(500).json({ error: 'Server error', message: err.message });
      }
    }

    if (req.method === 'PUT') {
      try {
        const { templateId, startDate, endDate, status, productIds } = req.body;

        const updateData = {};
        if (templateId !== undefined) {
          if (templateId < 1 || templateId > 5) {
            return res.status(400).json({ error: 'Template must be between 1 and 5' });
          }
          updateData.selectedTemplate = templateId;
        }

        if (startDate !== undefined) updateData.currentFlyerStart = startDate;
        if (endDate !== undefined) updateData.currentFlyerEnd = endDate;

        if (Object.keys(updateData).length > 0) {
          await Store.findByIdAndUpdate(req.storeId, { $set: updateData });
        }

        if (templateId && startDate && endDate) {
          const flyerData = {
            storeId: req.storeId,
            templateId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: status || (new Date(startDate) <= new Date() && new Date(endDate) >= new Date() ? 'active' : 'scheduled'),
            products: productIds || [],
          };

          const existingActive = await Flyer.findOne({
            storeId: req.storeId,
            status: 'active',
          }).lean();

          if (existingActive) {
            await Flyer.findByIdAndUpdate(existingActive._id, { $set: flyerData });
          } else {
            await Flyer.create(flyerData);
          }
        }

        const store = await Store.findById(req.storeId).select('selectedTemplate currentFlyerStart currentFlyerEnd').lean();
        const flyers = await Flyer.find({ storeId: req.storeId }).sort({ createdAt: -1 }).lean();

        return res.status(200).json({ store, flyers });
      } catch (err) {
        return res.status(500).json({ error: 'Server error', message: err.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  });
}
