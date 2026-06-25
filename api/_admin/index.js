export default async function route(path, req, res) {
  try {
    if (path === '/admin/login') {
      const { default: h } = await import('./login.js'); return h(req, res);
    }
    if (path === '/admin/seed') {
      const { default: h } = await import('./seed.js'); return h(req, res);
    }
    if (path.startsWith('/admin/stores')) {
      const { default: h } = await import('./stores.js'); return h(req, res);
    }
    if (path.startsWith('/admin/registrations')) {
      const { default: h } = await import('./registrations.js'); return h(req, res);
    }
    if (path.startsWith('/admin/admins')) {
      const { default: h } = await import('./admins.js'); return h(req, res);
    }
    if (path.startsWith('/admin/settings')) {
      const { default: h } = await import('./settings.js'); return h(req, res);
    }
    if (path.startsWith('/admin/logs')) {
      const { default: h } = await import('./logs.js'); return h(req, res);
    }
    if (path.startsWith('/admin/products')) {
      const { default: h } = await import('./products.js'); return h(req, res);
    }
    if (path.startsWith('/admin/reviews')) {
      const { default: h } = await import('./reviews.js'); return h(req, res);
    }
    if (path.startsWith('/admin/flyers')) {
      const { default: h } = await import('./flyers.js'); return h(req, res);
    }
    if (path.startsWith('/admin/broadcast')) {
      const { default: h } = await import('./broadcast.js'); return h(req, res);
    }
    if (path.startsWith('/admin/stats')) {
      const { default: h } = await import('./stats.js'); return h(req, res);
    }
  } catch (err) {
    console.error('Admin route error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
  return res.status(404).json({ error: 'Not found' });
}
