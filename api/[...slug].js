function cors(res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const slug = req.query.slug || [];
  const path = '/' + slug.join('/');

  try {
    if (path === '/health') {
      const { default: h } = await import('./_public/health.js');
      return h(req, res);
    }
    if (path.startsWith('/admin')) {
      const { default: router } = await import('./_admin/index.js');
      return router(path, req, res);
    }
    if (path.startsWith('/store')) {
      const { default: router } = await import('./_store/index.js');
      return router(path, req, res);
    }
    if (path.startsWith('/public')) {
      const { default: router } = await import('./_public/index.js');
      return router(path, req, res);
    }
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }

  return res.status(404).json({ error: 'Not found' });
}
