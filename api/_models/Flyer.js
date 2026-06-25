import mongoose from 'mongoose';

const flyerSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  templateId: { type: Number, required: true, min: 1, max: 5 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'expired'],
    default: 'draft',
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, {
  timestamps: true,
});

flyerSchema.index({ storeId: 1, status: 1 });
flyerSchema.index({ endDate: 1 });

export default mongoose.models.Flyer || mongoose.model('Flyer', flyerSchema);
