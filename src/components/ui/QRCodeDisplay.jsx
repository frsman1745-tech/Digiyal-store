import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { downloadQR, printQR } from '../../utils/qr';

export default function QRCodeDisplay({ dataUrl, productName, price, filename }) {
  const { direction } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6" style={{ direction }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-48 h-48 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 p-2">
          <img src={dataUrl} alt="QR Code" className="w-full h-full object-contain" loading="lazy" />
        </div>

        {productName && (
          <div className="text-center">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{productName}</h3>
            {price && <p className="text-lg font-bold text-primary mt-1">{price}</p>}
          </div>
        )}

        <div className="flex gap-3 w-full">
          <button
            onClick={() => downloadQR(dataUrl, filename)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('common.download')}
          </button>
          <button
            onClick={() => printQR(dataUrl, productName || '', price || '')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {t('common.print')}
          </button>
        </div>
      </div>
    </div>
  );
}
