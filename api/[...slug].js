import adminRouter from '../_admin/index.js';
import storeRouter from '../_store/index.js';
import publicRouter from '../_public/index.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-seed-key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let rest = '';
  const slug = req.query['...slug'] || req.query.slug;
  if (Array.isArray(slug)) {
    rest = slug.join('/');
  } else if (typeof slug === 'string' && slug) {
    rest = slug;
  } else {
    const url = (req.url || '').split('?')[0];
    const m = url.match(/^\/api\/(.+)$/);
    if (m) rest = m[1].replace(/\/+$/, '');
  }

  if (!rest) return res.status(404).json({ error: 'Not found' });

  const idx = rest.indexOf('/');
  const firstSegment = idx === -1 ? rest : rest.slice(0, idx);
  const restPath = idx === -1 ? '' : rest.slice(idx);

  try {
    if (firstSegment === 'admin') {
      return adminRouter('/admin' + restPath, req, res);
    }
    if (firstSegment === 'store') {
      return storeRouter('/store' + restPath, req, res);
    }
    if (firstSegment === 'public') {
      return publicRouter('/public' + restPath, req, res);
    }
    return res.status(404).json({ error: 'Not found', path: '/api/' + rest });
  } catch (err) {
    return res.status(500).json({ error: 'Router error', message: err.message });
  }
}
