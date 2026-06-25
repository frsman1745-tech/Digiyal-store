import loginHandler from './login.js';
import profileHandler from './profile.js';
import productsHandler from './products.js';
import flyerHandler from './flyer.js';
import uploadHandler from './upload.js';
import statsHandler from './stats.js';
import bulkImportHandler from './bulk-import.js';
import duplicateHandler from './duplicate.js';
import exportQrsHandler from './export-qrs.js';
import changePasswordHandler from './change-password.js';

export default function route(path, req, res) {
  if (path.startsWith('/store/login')) return loginHandler(req, res);
  if (path.startsWith('/store/profile')) return profileHandler(req, res);
  if (path.startsWith('/store/products')) return productsHandler(req, res);
  if (path.startsWith('/store/flyer')) return flyerHandler(req, res);
  if (path.startsWith('/store/upload')) return uploadHandler(req, res);
  if (path.startsWith('/store/stats')) return statsHandler(req, res);
  if (path.startsWith('/store/bulk-import')) return bulkImportHandler(req, res);
  if (path.startsWith('/store/duplicate')) return duplicateHandler(req, res);
  if (path.startsWith('/store/export-qrs')) return exportQrsHandler(req, res);
  if (path.startsWith('/store/change-password')) return changePasswordHandler(req, res);
  return res.status(404).json({ error: 'Not found' });
}
