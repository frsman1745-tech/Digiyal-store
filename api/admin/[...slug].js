import router from '../_admin/index.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-seed-key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url || '';
  const slug = req.query.slug;
  const queryKeys = Object.keys(req.query || {});

  return res.status(400).json({
    debug: true,
    url,
    slug,
    slugType: typeof slug,
    isArray: Array.isArray(slug),
    queryKeys,
    method: req.method,
  });
}
