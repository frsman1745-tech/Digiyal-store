import axios from 'axios';

function cors(res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

const LIBRE_URL = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com';
const LIBRE_KEY = process.env.LIBRETRANSLATE_API_KEY || '';

function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

function isEnglish(text) {
  return /^[a-zA-Z0-9\s.,!?;:'"\-()]+$/.test(text);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(200).json({ translatedText: '' });
    }

    if (isEnglish(text)) {
      return res.status(200).json({ translatedText: text });
    }

    if (!isArabic(text)) {
      return res.status(200).json({ translatedText: text });
    }

    const payload = { q: text, source: 'ar', target: 'en', format: 'text' };
    if (LIBRE_KEY) payload.api_key = LIBRE_KEY;

    const response = await axios.post(`${LIBRE_URL}/translate`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const translatedText = response.data?.translatedText || text;

    return res.status(200).json({ translatedText });
  } catch (err) {
    console.error('Translation error:', err);
    return res.status(500).json({ error: 'Translation failed' });
  }
}
