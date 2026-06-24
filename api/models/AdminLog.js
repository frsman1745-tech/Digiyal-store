import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  action: { type: String, required: true },
  targetId: { type: String, default: '' },
  targetName: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String, default: '' },
}, {
  timestamps: true,
});

adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1 });
adminLogSchema.index({ createdAt: -1 });

export default mongoose.models.AdminLog || mongoose.model('AdminLog', adminLogSchema);
