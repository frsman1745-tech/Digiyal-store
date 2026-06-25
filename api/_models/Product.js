import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  name: { type: String, required: true },
  nameEn: { type: String, default: '' },
  description: { type: String, default: '' },
  descriptionEn: { type: String, default: '' },
  image: { type: String, default: '' },
  imageSizeKB: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  originalPrice: { type: Number, default: null },
  offerStartDate: { type: Date, default: null },
  offerEndDate: { type: Date, default: null },
  category: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isFeaturedOnFlyer: { type: Boolean, default: false },
  flyerPosition: { type: Number, default: 0 },
  qrCodeBase64: { type: String, default: '' },
  qrCodeTargetUrl: { type: String, default: '' },
  qrScanCount: { type: Number, default: 0 },
  section: {
    sectionName: { type: String, default: '' },
    sectionOrder: { type: Number, default: 0 },
  },
  badges: [{
    type: { type: String, enum: ['new', 'hot_deal', 'low_stock', 'best_seller', 'bundle'] },
  }],
  bundleDeal: {
    bundleType: { type: String, default: '' },
    buyQuantity: { type: Number, default: 0 },
    getQuantity: { type: Number, default: 0 },
    bundlePrice: { type: Number, default: null },
    discountPercent: { type: Number, default: null },
    bundleDescription: { type: String, default: '' },
  },
}, {
  timestamps: true,
});

productSchema.index({ storeId: 1 });
productSchema.index({ storeId: 1, isActive: 1 });
productSchema.index({ offerEndDate: 1 });

export default mongoose.models.Product || mongoose.model('Product', productSchema);
