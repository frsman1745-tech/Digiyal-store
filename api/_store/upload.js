import { connectDB } from '../_middleware/db.js';
import { storeAuth } from '../_middleware/auth.js';
import Store from '../_models/Store.js';
import cloudinary from 'cloudinary';

function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || cloudName === 'your_cloud_name') {
    throw new Error('CLOUDINARY_CLOUD_NAME is not set in environment variables');
  }
  if (!apiKey || apiKey === 'your_api_key') {
    throw new Error('CLOUDINARY_API_KEY is not set in environment variables');
  }
  if (!apiSecret || apiSecret === 'your_api_secret') {
    throw new Error('CLOUDINARY_API_SECRET is not set in environment variables');
  }

  const v2 = cloudinary.v2;
  v2.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return v2;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await connectDB();

  return storeAuth(req, res, async () => {
    try {
      const cloudinaryV2 = getCloudinary();
      const { image, folder, publicId } = req.body;

      if (!image) {
        return res.status(400).json({ error: 'No image data provided' });
      }

      const uploadOptions = {
        folder: folder || `stores/${req.storeId}`,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      let imageBuffer = image;
      if (image.startsWith('data:')) {
        imageBuffer = image;
      } else if (image.startsWith('http')) {
        uploadOptions.upload_type = 'fetch';
      }

      const result = await cloudinaryV2.uploader.upload(imageBuffer, uploadOptions);

      const fileSizeKB = Math.round((result.bytes || 0) / 1024);

      await Store.findByIdAndUpdate(req.storeId, {
        $inc: { storageUsedMB: Math.max(0, Math.round(fileSizeKB / 1024 * 100) / 100) },
      });

      return res.status(200).json({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        sizeKB: fileSizeKB,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Upload failed', message: err.message });
    }
  });
}
