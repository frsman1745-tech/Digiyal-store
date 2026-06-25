import adminRouter from './_admin/index.js';
import storeRouter from './_store/index.js';
import publicRouter from './_public/index.js';
import healthHandler from './_public/health.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let path;
  const slug = req.query.slug;
  if (Array.isArray(slug)) {
    path = '/' + slug.join('/');
  } else if (typeof slug === 'string' && slug) {
    path = '/' + slug;
  } else if (slug) {
    path = '/' + String(slug);
  } else {
    path = '/' + (req.url || '').split('?')[0].replace(/^\/+/, '').split('/').filter(Boolean).slice(1).join('/');
  }

  if (path === '/health') return healthHandler(req, res);
  if (path.startsWith('/admin')) return adminRouter(path, req, res);
  if (path.startsWith('/store')) return storeRouter(path, req, res);
  if (path.startsWith('/public')) return publicRouter(path, req, res);

  return res.status(404).json({ error: 'Not found path: ' + path });
}
