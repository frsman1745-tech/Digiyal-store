import { connectDB } from '../_middleware/db.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';

const BASE_URL = process.env.BASE_URL || 'https://digitalstoreflyer.com';

function xmlSafe(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  await connectDB();

  const stores = await Store.find({ status: 'approved' })
    .select('_id slug updatedAt')
    .sort({ featuredOrder: 1 })
    .lean();

  const storeIds = stores.map(s => s._id);
  const products = await Product.find({
    storeId: { $in: storeIds },
    isActive: true,
    offerEndDate: { $gte: new Date() },
  })
    .select('_id updatedAt')
    .lean();

  const urls = [];

  urls.push(`  <url>
    <loc>${xmlSafe(BASE_URL)}/</loc>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>`);

  urls.push(`  <url>
    <loc>${xmlSafe(BASE_URL)}/stores</loc>
    <priority>0.8</priority>
    <changefreq>daily</changefreq>
  </url>`);

  for (const store of stores) {
    const slug = store.slug || store._id;
    urls.push(`  <url>
    <loc>${xmlSafe(BASE_URL)}/store/${xmlSafe(slug)}</loc>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${store.updatedAt ? new Date(store.updatedAt).toISOString().split('T')[0] : ''}</lastmod>
  </url>`);
  }

  for (const product of products) {
    urls.push(`  <url>
    <loc>${xmlSafe(BASE_URL)}/product/${product._id}</loc>
    <priority>0.6</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : ''}</lastmod>
  </url>`);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return res.status(200).send(sitemap);
}
