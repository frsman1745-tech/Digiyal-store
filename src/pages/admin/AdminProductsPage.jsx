import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useAdminAuth } from '../../hooks/useAuth';
import BackButton from '../../components/ui/BackButton';
import { Package, Search, Trash2, AlertCircle } from 'lucide-react';

export default function AdminProductsPage() {
  const { t, direction } = useLanguage();
  const { language } = useLanguage();
  const { adminPermissions } = useAdminAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const canDelete = adminPermissions.includes('manage_products');

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const { default: api } = await import('../../utils/api');
      const res = await api.get('/admin/products', { params: { search, limit: 100 } });
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`${language === 'ar' ? 'هل أنت متأكد من حذف المنتج' : 'Delete product'} "${name}"?`)) return;
    try {
      const { default: api } = await import('../../utils/api');
      await api.delete(`/admin/products?id=${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setTotal((prev) => prev - 1);
    } catch {}
  };

  return (
    <div className="p-4 max-w-6xl mx-auto pb-8" style={{ direction }}>
      <Helmet>
        <title>{language === 'ar' ? 'إدارة المنتجات' : 'Products Management'} - Digital Store</title>
      </Helmet>

      <div className="flex items-center gap-3 mb-6">
        <BackButton fallback="/admin/dashboard" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 flex-1">
          {language === 'ar' ? 'إدارة المنتجات' : 'Products Management'}
        </h1>
        <div className="relative">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
            className="ps-9 pe-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm w-48 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-500">
        {language === 'ar' ? `إجمالي المنتجات: ${total}` : `Total products: ${total}`}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div key={product._id} className="flex items-center gap-4 p-3 bg-white dark:bg-dark-light rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={20} /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {(language === 'ar' && product.name) || product.nameEn || product.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {product.storeId?.name || product.storeId || '—'}
                  {product.price ? ` • ${product.price} ${language === 'ar' ? 'ر.س' : 'SAR'}` : ''}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                product.isActive === false ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}>
                {product.isActive === false
                  ? (language === 'ar' ? 'غير نشط' : 'Inactive')
                  : (language === 'ar' ? 'نشط' : 'Active')}
              </span>
              {canDelete && (
                <button onClick={() => handleDelete(product._id, product.name)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                  title={language === 'ar' ? 'حذف' : 'Delete'}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Package size={48} className="mb-3" />
              <p className="text-sm">{language === 'ar' ? 'لا توجد منتجات' : 'No products found'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
