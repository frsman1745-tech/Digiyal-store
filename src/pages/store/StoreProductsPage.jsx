import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonCard from '../../components/ui/SkeletonCard';
import BackButton from '../../components/ui/BackButton';

export default function StoreProductsPage() {
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { default: api } = await import('../../utils/api');
        const res = await api.get('/store/products');
        setProducts(res.data.products || res.data || []);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm(t('store.products.confirmDelete'))) return;
    try {
      const { default: api } = await import('../../utils/api');
      await api.delete(`/store/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch {}
  };

  if (loading) {
    return (
      <div className="px-4 max-w-2xl mx-auto pt-6 space-y-4" style={{ direction }}>
        {[1, 2, 3].map((i) => <SkeletonCard key={i} variant="product-card" />)}
      </div>
    );
  }

  return (
    <div className="px-4 max-w-2xl mx-auto pt-6 pb-8" style={{ direction }}>
      <div className="flex items-center gap-3 mb-6">
        <BackButton fallback="/store/dashboard" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 flex-1">{t('store.products.title')}</h1>
        <button onClick={() => navigate('/store/products/new')}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
        >
          {t('store.products.add')}
        </button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title={t('store.products.noProducts')}
          actionLabel={t('store.products.add')}
          onAction={() => navigate('/store/products/new')}
        />
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product._id} className="flex items-center gap-4 p-4 bg-white dark:bg-dark-light rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{product.name}</p>
                <p className="text-xs text-primary font-semibold">{product.price} SAR</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => navigate(`/store/products/${product._id}/edit`)}
                  className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  {t('store.products.edit')}
                </button>
                <button onClick={() => handleDelete(product._id)}
                  className="px-3 py-1.5 text-xs font-medium text-danger bg-danger/10 rounded-lg hover:bg-danger/20 transition-colors"
                >
                  {t('store.products.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
