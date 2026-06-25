import storesHandler from './stores.js';
import productsHandler from './products.js';
import registrationsHandler from './registrations.js';
import translateHandler from './translate.js';
import sitemapHandler from './sitemap.xml.js';

export default function route(path, req, res) {
  if (path.startsWith('/public/stores')) return storesHandler(req, res);
  if (path.startsWith('/public/products')) return productsHandler(req, res);
  if (path.startsWith('/public/registrations')) return registrationsHandler(req, res);
  if (path.startsWith('/public/translate')) return translateHandler(req, res);
  if (path.startsWith('/public/sitemap.xml')) return sitemapHandler(req, res);
  return res.status(404).json({ error: 'Not found' });
}
