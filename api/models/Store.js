import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameEn: { type: String, default: '' },
  logo: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  description: { type: String, default: '' },
  descriptionEn: { type: String, default: '' },
  category: {
    type: String,
    enum: ['grocery', 'supermarket', 'minimarket', 'organic', 'other'],
    default: 'other',
  },
  location: {
    city: { type: String, default: '' },
    area: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  contact: {
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  isFeatured: { type: Boolean, default: false },
  featuredOrder: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  plan: {
    type: String,
    enum: ['trial', 'basic', 'advanced', 'pro', 'custom'],
    default: 'trial',
  },
  productLimit: { type: Number, default: 10 },
  monthlyPrice: { type: Number, default: 0 },
  storageUsedMB: { type: Number, default: 0 },
  currentFlyerStart: { type: Date, default: null },
  currentFlyerEnd: { type: Date, default: null },
  selectedTemplate: { type: Number, default: 1, min: 1, max: 5 },
  customColors: {
    primary: { type: String, default: '#1E40AF' },
    secondary: { type: String, default: '#F59E0B' },
    accent: { type: String, default: '#10B981' },
  },
  slug: { type: String, unique: true, sparse: true },
  storeQrCodeBase64: { type: String, default: '' },
  flyerViewCount: { type: Number, default: 0 },
  qrScanCount: { type: Number, default: 0 },
  onboardingStep: { type: Number, default: 0, min: 0, max: 4 },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  slugLastChangedAt: { type: Date, default: null },
}, {
  timestamps: true,
});

storeSchema.index({ status: 1 });
storeSchema.index({ isFeatured: 1, featuredOrder: 1 });
storeSchema.index({ rating: -1 });
storeSchema.index({ slug: 1 }, { sparse: true });

export default mongoose.models.Store || mongoose.model('Store', storeSchema);
