import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  userName: { type: String, default: '' },
}, {
  timestamps: true,
});

reviewSchema.index({ storeId: 1 });

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);
