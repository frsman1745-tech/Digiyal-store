import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import PriceDisplay from './PriceDisplay';
import OfferCountdown from '../ui/OfferCountdown';

const BADGE_COLORS = {
  new: 'bg-green-500',
  hot_deal: 'bg-red-500',
  low_stock: 'bg-orange-500',
  best_seller: 'bg-purple-500',
  bundle: 'bg-blue-500',
};

const BADGE_LABELS = {
  new: 'badge.new',
  hot_deal: 'badge.hot_deal',
  low_stock: 'badge.low_stock',
  best_seller: 'badge.best_seller',
  bundle: 'badge.bundle',
};

export default function ProductCard({ product }) {
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const hasBadges = product.badges && product.badges.length > 0;

  return (
    <div
      onClick={() => navigate(`/product/${product._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/product/${product._id}`)}
      className="relative group bg-white dark:bg-dark-light rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
      style={{ direction }}
    >
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {product.image && !imgError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {product.offerEnd && (
          <div className="absolute top-2 left-2 z-10">
            <OfferCountdown offerEndDate={product.offerEnd} />
          </div>
        )}

        {hasBadges && (
          <div className={`absolute top-2 ${direction === 'rtl' ? 'left-2' : 'right-2'} z-10 flex flex-col gap-1`}>
            {product.badges.map((badge) => (
              <span
                key={badge}
                className={`px-2 py-0.5 text-[10px] font-bold text-white rounded-lg shadow-sm ${BADGE_COLORS[badge] || 'bg-gray-500'}`}
              >
                {t(BADGE_LABELS[badge] || badge)}
              </span>
            ))}
          </div>
        )}

        {product.bundleType && (
          <div className={`absolute bottom-2 ${direction === 'rtl' ? 'right-2' : 'left-2'} z-10 px-2 py-0.5 bg-blue-500/90 text-white text-[10px] font-bold rounded-lg`}>
            {product.bundleType}
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-tight line-clamp-2">
          {product.name}
        </h3>
        <PriceDisplay price={product.price} originalPrice={product.originalPrice} />
        {product.offerEnd && (
          <p className="text-[10px] text-gray-400">
            {t('product.offerEnds')}: {new Date(product.offerEnd).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
