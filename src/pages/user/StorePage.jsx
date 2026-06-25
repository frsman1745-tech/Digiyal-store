import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import ProductCard from '../../components/product/ProductCard';
import SkeletonCard from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';

export default function StorePage() {
  const { slug } = useParams();
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      try {
        const { default: api } = await import('../../utils/api');
        const [storeRes, productsRes] = await Promise.all([
          api.get(`/public/stores/${slug}`),
          api.get(`/public/stores/${slug}/products`),
        ]);
        setStore(storeRes.data.store || storeRes.data);
        setProducts(productsRes.data.products || []);
      } catch {
        setStore(null);
      }
      setLoading(false);
    };
    fetchStore();
  }, [slug]);

  const filtered = products.filter((p) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: store?.name, url: window.location.href });
    }
  };

  if (loading) {
    return (
      <div className="px-4 max-w-2xl mx-auto space-y-4 pt-6" style={{ direction }}>
        <SkeletonCard variant="store-card" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} variant="product-card" />)}
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="px-4 pt-6" style={{ direction }}>
        <EmptyState title={t('common.error')} description={t('common.noResults')} />
      </div>
    );
  }

  return (
    <div className="px-4 max-w-2xl mx-auto space-y-6 pb-8" style={{ direction }}>
      <div className="pt-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-primary bg-primary/5">
                {(store.name || 'S')[0]}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">{store.name}</h1>
            {store.city && <p className="text-sm text-gray-500">{store.city}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {store.phone && (
            <a
              href={`https://wa.me/${store.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-full hover:bg-green-600 transition-colors"
            >
              {t('store.whatsapp')}
            </a>
          )}
          {store.location && (
            <a
              href={`https://maps.google.com/?q=${store.location.lat},${store.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full hover:bg-primary/20 transition-colors"
            >
              {t('store.openMap')}
            </a>
          )}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-dark-light text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors"
          >
            {t('store.share')}
          </button>
        </div>

        {store.offerStart && store.offerEnd && (
          <p className="mt-4 text-sm text-gray-500">
            {t('store.offersFrom')} {new Date(store.offerStart).toLocaleDateString()} {t('store.offersTo')} {new Date(store.offerEnd).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="relative">
        <svg className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${direction === 'rtl' ? 'right-3' : 'left-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('store.searchProducts')}
          className={`w-full px-4 py-2.5 ${direction === 'rtl' ? 'pr-10' : 'pl-10'} rounded-xl bg-white dark:bg-dark-light border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all`}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('store.noProducts')} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
