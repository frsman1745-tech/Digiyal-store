import axios from 'axios';

function cors(res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

const AZURE_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
const AZURE_REGION = process.env.AZURE_TRANSLATOR_REGION || '';

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

    if (!AZURE_KEY) {
      return res.status(200).json({ translatedText: text, warning: 'Translation API key not configured' });
    }

    const headers = {
      'Ocp-Apim-Subscription-Key': AZURE_KEY,
      'Content-Type': 'application/json; charset=UTF-8',
    };
    if (AZURE_REGION) {
      headers['Ocp-Apim-Subscription-Region'] = AZURE_REGION;
    }

    const response = await axios.post(
      `${AZURE_ENDPOINT}/translate?api-version=3.0&from=ar&to=en`,
      [{ Text: text }],
      { headers }
    );

    const translatedText = response.data?.[0]?.translations?.[0]?.text || text;

    return res.status(200).json({ translatedText });
  } catch (err) {
    console.error('Translation error:', err);
    return res.status(500).json({ error: 'Translation failed' });
  }
}
