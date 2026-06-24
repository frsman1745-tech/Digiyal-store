import mongoose from 'mongoose';

const storeAccountSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null },
}, {
  timestamps: true,
});

export default mongoose.models.StoreAccount || mongoose.model('StoreAccount', storeAccountSchema);
