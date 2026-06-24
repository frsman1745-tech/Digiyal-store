import mongoose from 'mongoose';

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator', 'viewer'];

const rolePermissions = {
  super_admin: ['manage_admins', 'manage_stores', 'manage_registrations', 'manage_settings', 'view_logs', 'send_broadcast', 'manage_products', 'manage_reviews', 'view_dashboard'],
  admin: ['manage_stores', 'manage_registrations', 'manage_settings', 'view_logs', 'send_broadcast', 'manage_products', 'manage_reviews', 'view_dashboard'],
  moderator: ['manage_stores', 'manage_registrations', 'view_logs', 'manage_products', 'manage_reviews', 'view_dashboard'],
  viewer: ['view_dashboard', 'view_logs'],
};

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  name: { type: String, required: true },
  isSuperAdmin: { type: Boolean, default: false },
  role: { type: String, enum: ADMIN_ROLES, default: 'admin' },
}, {
  timestamps: true,
});

adminSchema.methods.hasPermission = function(permission) {
  return (rolePermissions[this.role] || []).includes(permission);
};

adminSchema.statics.getPermissionsForRole = function(role) {
  return rolePermissions[role] || [];
};

export default mongoose.models.Admin || mongoose.model('Admin', adminSchema);
