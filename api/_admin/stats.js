import { connectDB } from '../_middleware/db.js';
import { adminAuth } from '../_middleware/auth.js';
import Store from '../_models/Store.js';
import Product from '../_models/Product.js';
import StoreRegistration from '../_models/StoreRegistration.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();

  return adminAuth(req, res, async () => {
    try {
      const [
        totalStores,
        pendingRegistrations,
        approvedStores,
        suspendedStores,
        totalProducts,
        storageAgg,
        topStores,
        planDistribution,
        registrationsByStatus,
      ] = await Promise.all([
        Store.countDocuments(),
        StoreRegistration.countDocuments({ status: 'pending' }),
        Store.countDocuments({ status: 'approved' }),
        Store.countDocuments({ status: 'suspended' }),
        Product.countDocuments(),
        Store.aggregate([
          { $group: { _id: null, totalMB: { $sum: '$storageUsedMB' } } },
        ]),
        Store.find({ status: 'approved' })
          .select('name nameEn flyerViewCount qrScanCount logo')
          .sort({ flyerViewCount: -1 })
          .limit(10)
          .lean(),
        Store.aggregate([
          { $group: { _id: '$plan', count: { $sum: 1 } } },
        ]),
        StoreRegistration.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ]);

      const totalStorageMB = storageAgg.length > 0 ? Math.round(storageAgg[0].totalMB * 100) / 100 : 0;

      const now = new Date();
      const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);

      const weeklyStoreData = await Store.aggregate([
        { $match: { createdAt: { $gte: twelveWeeksAgo } } },
        {
          $group: {
            _id: {
              year: { $isoWeekYear: '$createdAt' },
              week: { $isoWeek: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const qrScansToday = await Store.aggregate([
        { $match: { updatedAt: { $gte: today } } },
        { $group: { _id: null, scans: { $sum: '$qrScanCount' } } },
      ]);

      const totalQrScans = await Store.aggregate([
        { $group: { _id: null, scans: { $sum: '$qrScanCount' } } },
      ]);

      const planDist = {};
      planDistribution.forEach(p => { planDist[p._id] = p.count; });

      const registrationStatusDist = {};
      registrationsByStatus.forEach(r => { registrationStatusDist[r._id] = r.count; });

      return res.status(200).json({
        totalStores,
        pendingRegistrations,
        approvedStores,
        suspendedStores,
        totalProducts,
        totalStorageMB,
        qrScansToday: qrScansToday.length > 0 ? qrScansToday[0].scans : 0,
        totalQrScans: totalQrScans.length > 0 ? totalQrScans[0].scans : 0,
        weeklyNewStores: weeklyStoreData,
        topStores,
        planDistribution: planDist,
        registrationStatusDistribution: registrationStatusDist,
      });
    } catch (err) {
      console.error('Stats error:', err);
      return res.status(500).json({ error: 'Server error', message: err.message });
    }
  });
}
