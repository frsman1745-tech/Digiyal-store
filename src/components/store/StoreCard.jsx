import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import FeaturedBadge from './FeaturedBadge';

const FAVORITES_KEY = 'store_favorites';

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch { return []; }
}

function toggleFavorite(storeId) {
  const favs = getFavorites();
  const idx = favs.indexOf(storeId);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(storeId);
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs)); } catch {}
  return favs;
}

export default function StoreCard({ store }) {
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(getFavorites().includes(store._id));
  }, [store._id]);

  const handleFav = (e) => {
    e.stopPropagation();
    toggleFavorite(store._id);
    setIsFav(!isFav);
  };

  const slug = store.slug || store._id;

  return (
    <div
      onClick={() => navigate(`/store/${slug}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/store/${slug}`)}
      className="relative bg-white dark:bg-dark-light rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
      style={{ direction }}
    >
      {store.isFeatured && <FeaturedBadge />}

      <button
        onClick={handleFav}
        className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 dark:bg-dark/80 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
        aria-label="Toggle favorite"
      >
        <svg
          className={`w-5 h-5 ${isFav ? 'text-danger fill-current' : 'text-gray-400'}`}
          fill={isFav ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <div className="flex items-center gap-4 p-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
          {store.logo ? (
            <img src={store.logo} alt={store.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary bg-primary/5">
              {(store.name || 'S')[0]}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
              {store.name}
            </h3>
            {store.category && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full shrink-0">
                {t(`home.filter.${store.category}`) || store.category}
              </span>
            )}
          </div>

          {store.city && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {store.city}
            </p>
          )}

          <div className="flex items-center gap-3">
            {store.rating > 0 && (
              <span className="text-xs text-secondary font-medium flex items-center gap-0.5">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {store.rating.toFixed(1)}
              </span>
            )}

            {store.offerStart && store.offerEnd && (
              <span className="text-[10px] text-gray-400">
                {new Date(store.offerStart).toLocaleDateString()} - {new Date(store.offerEnd).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={direction === 'rtl' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
        </svg>
      </div>
    </div>
  );
}
