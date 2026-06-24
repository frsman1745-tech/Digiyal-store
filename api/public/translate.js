import axios from 'axios';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

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

    if (!GOOGLE_TRANSLATE_API_KEY) {
      return res.status(200).json({ translatedText: text, warning: 'Translation API key not configured' });
    }

    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2`,
      {},
      {
        params: {
          q: text,
          target: 'en',
          source: 'ar',
          format: 'text',
          key: GOOGLE_TRANSLATE_API_KEY,
        },
      }
    );

    const translatedText = response.data?.data?.translations?.[0]?.translatedText || text;

    return res.status(200).json({ translatedText });
  } catch (err) {
    return res.status(500).json({ error: 'Translation failed', message: err.message });
  }
}
