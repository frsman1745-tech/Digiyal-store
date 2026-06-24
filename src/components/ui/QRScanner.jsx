import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';

const SCANNER_ID = 'qr-scanner-element';

export default function QRScanner({ onScan, onError }) {
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const scannerRef = useRef(null);
  const [permission, setPermission] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState('');

  useEffect(() => {
    const start = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setPermission(true);
      } catch {
        setPermission(false);
        return;
      }

      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (decodedText && decodedText !== lastResult) {
              setLastResult(decodedText);
              if (navigator.vibrate) navigator.vibrate(100);
              setScanning(false);
              onScan(decodedText);
            }
          },
          () => {},
        );
        setScanning(true);
      } catch {
        setPermission(false);
      }
    };

    start();

    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4" style={{ direction }}>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('scanner.title')}</h2>

      {permission === null && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        </div>
      )}

      {permission === false && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            {t('scanner.permission')}
          </p>
        </div>
      )}

      {permission === true && (
        <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black">
          <div id={SCANNER_ID} className="w-full h-full" />

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-8 border-2 border-white/40 rounded-xl" />
            <div className="absolute left-8 right-8 h-0.5 bg-primary/80 shadow-[0_0_12px_rgba(37,99,235,0.6)] animate-scan-line" />
            <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
          </div>

          {scanning && (
            <div className="absolute top-4 inset-x-4 flex justify-center">
              <span className="px-3 py-1 bg-green-500/80 text-white text-xs font-medium rounded-full animate-pulse">
                {t('scanner.title')}
              </span>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleManualSubmit} className="w-full max-w-sm">
        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
          {t('scanner.fallback')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={t('scanner.fallback')}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            OK
          </button>
        </div>
      </form>
    </div>
  );
}
