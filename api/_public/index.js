export default async function route(path, req, res) {
  try {
    if (path.startsWith('/public/stores')) {
      const { default: h } = await import('./stores.js'); return h(req, res);
    }
    if (path.startsWith('/public/products')) {
      const { default: h } = await import('./products.js'); return h(req, res);
    }
    if (path.startsWith('/public/registrations')) {
      const { default: h } = await import('./registrations.js'); return h(req, res);
    }
    if (path.startsWith('/public/translate')) {
      const { default: h } = await import('./translate.js'); return h(req, res);
    }
    if (path.startsWith('/public/sitemap.xml')) {
      const { default: h } = await import('./sitemap.xml.js'); return h(req, res);
    }
  } catch (err) {
    console.error('Public route error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
  return res.status(404).json({ error: 'Not found' });
}
