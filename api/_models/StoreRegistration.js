import mongoose from 'mongoose';

const storeRegistrationSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  storeType: { type: String, default: '' },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNote: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
}, {
  timestamps: true,
});

storeRegistrationSchema.index({ status: 1 });

export default mongoose.models.StoreRegistration || mongoose.model('StoreRegistration', storeRegistrationSchema);
