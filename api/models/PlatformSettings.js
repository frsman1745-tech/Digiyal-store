import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema({
  platformNameAr: { type: String, default: 'منصة الإعلانات الرقمية' },
  platformNameEn: { type: String, default: 'Digital Store Flyer' },
  defaultPlanOnApproval: { type: String, default: 'trial' },
  defaultProductLimitOnApproval: { type: Number, default: 10 },
  maxImageSizeKB: { type: Number, default: 150 },
  allowStoreRegistrations: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  seasonalTemplates: {
    ramadan: {
      active: { type: Boolean, default: false },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
    },
    eid: {
      active: { type: Boolean, default: false },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
    },
    nationalDay: {
      active: { type: Boolean, default: false },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
    },
  },
}, {
  timestamps: true,
});

export async function getSettings() {
  const Settings = mongoose.models.PlatformSettings || mongoose.model('PlatformSettings', platformSettingsSchema);
  let settings = await Settings.findOne().lean();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

export default mongoose.models.PlatformSettings || mongoose.model('PlatformSettings', platformSettingsSchema);
