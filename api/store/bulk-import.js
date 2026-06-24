import { connectDB } from '../_middleware/db.js';
import { storeAuth } from '../_middleware/auth.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import QRCode from 'qrcode';
import XLSX from 'xlsx';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

const BASE_URL = process.env.BASE_URL || 'https://digitalstoreflyer.com';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();

  return storeAuth(req, res, async () => {
    try {
      const store = await Store.findById(req.storeId).lean();
      if (!store) return res.status(404).json({ error: 'Store not found' });

      const currentCount = await Product.countDocuments({ storeId: req.storeId });
      const availableSlots = store.productLimit - currentCount;

      if (availableSlots <= 0) {
        return res.status(403).json({
          error: `Product limit reached (${store.productLimit}/${store.productLimit}). No slots available.`,
        });
      }

      const { fileData, fileName } = req.body;

      if (!fileData) {
        return res.status(400).json({ error: 'No file data provided. Send base64-encoded file content.' });
      }

      let workbook;
      try {
        const buffer = Buffer.from(fileData, 'base64');
        workbook = XLSX.read(buffer, { type: 'buffer' });
      } catch {
        return res.status(400).json({ error: 'Invalid file format. Please send a valid Excel/CSV file.' });
      }

      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (!rows || rows.length === 0) {
        return res.status(400).json({ error: 'File is empty or has no valid data rows' });
      }

      const results = { added: 0, failed: 0, errors: [] };
      const storeSlug = store.slug || store._id;

      for (let i = 0; i < rows.length; i++) {
        if (results.added >= availableSlots) {
          results.errors.push({
            row: i + 2,
            error: `Product limit reached. Import stopped at ${results.added} products.`,
          });
          break;
        }

        const row = rows[i];
        const name = row['name'] || row['Name'] || row['NAME'] || row['اسم'] || '';

        if (!name || name.toString().trim().length === 0) {
          results.failed++;
          results.errors.push({ row: i + 2, error: 'Name is required' });
          continue;
        }

        try {
          const price = parseFloat(row['price'] || row['Price'] || row['PRICE'] || row['السعر'] || 0);
          const originalPrice = parseFloat(
            row['originalPrice'] || row['OriginalPrice'] || row['original_price'] || row['السعر الأصلي'] || ''
          ) || null;

          const product = await Product.create({
            storeId: req.storeId,
            name: name.toString().trim(),
            nameEn: (row['nameEn'] || row['NameEn'] || row['name_en'] || row['اسم انجليزي'] || '').toString().trim(),
            description: (row['description'] || row['Description'] || row['DESC'] || row['الوصف'] || '').toString().trim(),
            price: isNaN(price) ? 0 : price,
            originalPrice: originalPrice && !isNaN(originalPrice) ? originalPrice : null,
            offerStartDate: row['offerStartDate'] || row['offer_start_date'] || null,
            offerEndDate: row['offerEndDate'] || row['offer_end_date'] || null,
            category: (row['category'] || row['Category'] || row['القسم'] || '').toString().trim(),
            isActive: true,
            section: {
              sectionName: (row['section'] || row['Section'] || '').toString().trim(),
              sectionOrder: parseInt(row['sectionOrder'] || row['SectionOrder'] || 0) || 0,
            },
          });

          const targetUrl = `${BASE_URL}/product/${product._id}?source=qr&store=${storeSlug}`;
          const qrDataUrl = await QRCode.toDataURL(targetUrl, { width: 300, margin: 2 });
          await Product.findByIdAndUpdate(product._id, {
            $set: { qrCodeBase64: qrDataUrl, qrCodeTargetUrl: targetUrl },
          });

          results.added++;
        } catch (err) {
          results.failed++;
          results.errors.push({ row: i + 2, error: err.message });
        }
      }

      return res.status(200).json({
        message: `Import complete: ${results.added} added, ${results.failed} failed`,
        ...results,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Import failed', message: err.message });
    }
  });
}
