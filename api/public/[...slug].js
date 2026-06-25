import router from '../_public/index.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  let rest;
  const slug = req.query['...slug'];
  if (Array.isArray(slug)) {
    rest = slug.join('/');
  } else if (typeof slug === 'string' && slug) {
    rest = slug;
  } else {
    rest = (req.url || '').split('?')[0].replace(/^\/+/, '').split('/').filter(Boolean).slice(2).join('/');
  }

  const path = '/public/' + (rest || '');

  try {
    return router(path, req, res);
  } catch (err) {
    return res.status(500).json({ error: 'Router error', message: err.message });
  }
}
