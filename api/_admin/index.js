import loginHandler from './login.js';
import storesHandler from './stores.js';
import registrationsHandler from './registrations.js';
import adminsHandler from './admins.js';
import settingsHandler from './settings.js';
import logsHandler from './logs.js';
import productsHandler from './products.js';
import reviewsHandler from './reviews.js';
import flyersHandler from './flyers.js';
import broadcastHandler from './broadcast.js';
import statsHandler from './stats.js';
import seedHandler from './seed.js';

export default function route(path, req, res) {
  if (path === '/admin/login') return loginHandler(req, res);
  if (path.startsWith('/admin/stores')) return storesHandler(req, res);
  if (path.startsWith('/admin/registrations')) return registrationsHandler(req, res);
  if (path.startsWith('/admin/admins')) return adminsHandler(req, res);
  if (path.startsWith('/admin/settings')) return settingsHandler(req, res);
  if (path.startsWith('/admin/logs')) return logsHandler(req, res);
  if (path.startsWith('/admin/products')) return productsHandler(req, res);
  if (path.startsWith('/admin/reviews')) return reviewsHandler(req, res);
  if (path.startsWith('/admin/flyers')) return flyersHandler(req, res);
  if (path.startsWith('/admin/broadcast')) return broadcastHandler(req, res);
  if (path.startsWith('/admin/stats')) return statsHandler(req, res);
  if (path === '/admin/seed') return seedHandler(req, res);
  return res.status(404).json({ error: 'Not found', path });
}
