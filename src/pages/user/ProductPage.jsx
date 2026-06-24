import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import PriceDisplay from '../../components/product/PriceDisplay';
import OfferCountdown from '../../components/ui/OfferCountdown';
import QRCodeDisplay from '../../components/ui/QRCodeDisplay';
import SkeletonCard from '../../components/ui/SkeletonCard';
import { generateQRDataUrl } from '../../utils/qr';

export default function ProductPage() {
  const { id } = useParams();
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { default: api } = await import('../../utils/api');
        const res = await api.get(`/products/${id}`);
        const p = res.data.product || res.data;
        setProduct(p);
        if (p._id) {
          const qr = await generateQRDataUrl(`${window.location.origin}/product/${p._id}`);
          setQrDataUrl(qr);
        }
      } catch {
        setProduct(null);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name, url: window.location.href });
    }
  };

  if (loading) return <div className="px-4 max-w-lg mx-auto pt-6" style={{ direction }}><SkeletonCard variant="product-detail" /></div>;
  if (!product) return <div className="px-4 pt-6 text-center text-gray-500" style={{ direction }}>{t('common.noResults')}</div>;

  return (
    <div className="px-4 max-w-lg mx-auto space-y-6 pb-8" style={{ direction }}>
      <div className="pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-primary mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={direction === 'rtl' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
          </svg>
          {t('common.back')}
        </button>
      </div>

      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
        {product.image && !imgError ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {product.offerEnd && <OfferCountdown offerEndDate={product.offerEnd} />}
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{product.name}</h1>

        <PriceDisplay price={product.price} originalPrice={product.originalPrice} />

        {product.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{product.description}</p>
        )}

        {product.category && (
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
            {t(`home.filter.${product.category}`) || product.category}
          </span>
        )}

        {product.offerEnd && (
          <p className="text-sm text-gray-400">
            {t('product.offerEnds')}: {new Date(product.offerEnd).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        {product.storeId && (
          <button onClick={() => navigate(`/store/${product.storeId.slug || product.storeId._id}`)}
            className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            {t('product.viewStore')}
          </button>
        )}
        <button onClick={handleShare}
          className="px-4 py-2.5 bg-gray-100 dark:bg-dark-light text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      {qrDataUrl && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">QR Code</h3>
          <QRCodeDisplay
            dataUrl={qrDataUrl}
            productName={product.name}
            price={`${product.price} SAR`}
            filename={`product-${product._id}.png`}
          />
        </div>
      )}
    </div>
  );
}
