export default async function route(path, req, res) {
  try {
    if (path.startsWith('/store/login')) {
      const { default: h } = await import('./login.js'); return h(req, res);
    }
    if (path.startsWith('/store/profile')) {
      const { default: h } = await import('./profile.js'); return h(req, res);
    }
    if (path.startsWith('/store/products')) {
      const { default: h } = await import('./products.js'); return h(req, res);
    }
    if (path.startsWith('/store/flyer')) {
      const { default: h } = await import('./flyer.js'); return h(req, res);
    }
    if (path.startsWith('/store/upload')) {
      const { default: h } = await import('./upload.js'); return h(req, res);
    }
    if (path.startsWith('/store/stats')) {
      const { default: h } = await import('./stats.js'); return h(req, res);
    }
    if (path.startsWith('/store/bulk-import')) {
      const { default: h } = await import('./bulk-import.js'); return h(req, res);
    }
    if (path.startsWith('/store/duplicate')) {
      const { default: h } = await import('./duplicate.js'); return h(req, res);
    }
    if (path.startsWith('/store/export-qrs')) {
      const { default: h } = await import('./export-qrs.js'); return h(req, res);
    }
  } catch (err) {
    console.error('Store route error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
  return res.status(404).json({ error: 'Not found' });
}
