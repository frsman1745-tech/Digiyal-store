import router from '../_store/index.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
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
    const m = url.match(/^\/api\/store\/(.+)$/) || url.match(/^\/store\/(.+)$/) || url.match(/^\/(.+)$/);
    if (m) rest = m[1].replace(/\/+$/, '');
  }

  const path = '/store/' + (rest || '');

  try {
    return router(path, req, res);
  } catch (err) {
    return res.status(500).json({ error: 'Router error', message: err.message });
  }
}
