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
        const { templateId, startDate, endDate, status, productIds, selectedTemplate, currentFlyerStart, currentFlyerEnd } = req.body;
        const tId = templateId || selectedTemplate;
        const sDate = startDate || currentFlyerStart;
        const eDate = endDate || currentFlyerEnd;

        if (tId !== undefined && (tId < 1 || tId > 5)) {
          return res.status(400).json({ error: 'Template must be between 1 and 5' });
        }

        const storeUpdate = {};
        if (tId !== undefined) storeUpdate.selectedTemplate = tId;
        if (sDate !== undefined) storeUpdate.currentFlyerStart = sDate;
        if (eDate !== undefined) storeUpdate.currentFlyerEnd = eDate;
        if (Object.keys(storeUpdate).length > 0) {
          await Store.findByIdAndUpdate(req.storeId, { $set: storeUpdate });
        }

        const existingFlyer = await Flyer.findOne({ storeId: req.storeId }).sort({ createdAt: -1 }).lean();

        if (existingFlyer) {
          const flyerUpdate = {};
          if (tId !== undefined) flyerUpdate.templateId = tId;
          if (sDate !== undefined) flyerUpdate.startDate = new Date(sDate);
          if (eDate !== undefined) flyerUpdate.endDate = new Date(eDate);
          if (status !== undefined) flyerUpdate.status = status;
          if (productIds !== undefined) flyerUpdate.products = productIds;
          if (Object.keys(flyerUpdate).length > 0) {
            await Flyer.findByIdAndUpdate(existingFlyer._id, { $set: flyerUpdate });
          }
        } else if (tId && sDate && eDate) {
          await Flyer.create({
            storeId: req.storeId,
            templateId: tId,
            startDate: new Date(sDate),
            endDate: new Date(eDate),
            status: status || (new Date(sDate) <= new Date() && new Date(eDate) >= new Date() ? 'active' : 'scheduled'),
            products: productIds || [],
          });
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
