import Admin from '../_models/Admin.js';

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

export function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const adminPermissions = req.admin.permissions || Admin.getPermissionsForRole(req.admin.role);
    const hasAll = permissions.every(p => adminPermissions.includes(p));
    if (!hasAll) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

export function requireSuperAdmin(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.admin.role !== 'super_admin' && !req.admin.isSuperAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
