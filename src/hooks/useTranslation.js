import { useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import ar from '../locales/ar.json';
import en from '../locales/en.json';

const locales = { ar, en };

export function useTranslation() {
  const { language, direction } = useLanguage();

  const t = useCallback((key, params = {}) => {
    const dict = locales[language] || locales.ar;
    let val = dict[key];
    if (!val) {
      val = locales.ar[key] || key;
    }
    if (params && typeof val === 'string') {
      val = val.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
    }
    return val;
  }, [language]);

  return { t, language, direction };
}
