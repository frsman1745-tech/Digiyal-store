import { connectDB } from '../_middleware/db.js';
import StoreRegistration from '../_models/StoreRegistration.js';
import { getSettings } from '../_models/PlatformSettings.js';

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

  const settings = await getSettings();
  if (!settings.allowStoreRegistrations) {
    return res.status(403).json({ error: 'Store registrations are currently closed' });
  }

  try {
    const { storeName, ownerName, email, phone, city, storeType, message } = req.body;

    const errors = [];
    if (!storeName || storeName.trim().length < 2) errors.push('Store name must be at least 2 characters');
    if (!ownerName || ownerName.trim().length < 2) errors.push('Owner name must be at least 2 characters');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
    if (!phone || phone.trim().length < 7) errors.push('Valid phone is required');
    if (!city || city.trim().length < 2) errors.push('City is required');

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const existing = await StoreRegistration.findOne({
      email: email.toLowerCase(),
      status: 'pending',
    }).lean();
    if (existing) {
      return res.status(409).json({ error: 'A pending registration already exists for this email' });
    }

    const registration = await StoreRegistration.create({
      storeName: storeName.trim(),
      ownerName: ownerName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      city: city.trim(),
      storeType: storeType || '',
      message: message || '',
    });

    return res.status(201).json({
      message: 'Registration submitted successfully',
      id: registration._id,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
}
