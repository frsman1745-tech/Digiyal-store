import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import StoreCard from '../../components/store/StoreCard';
import SkeletonCard from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';

const FILTERS = ['all', 'grocery', 'supermarket', 'minimarket', 'organic'];
const SORTS = ['featured', 'rating', 'newest'];

export default function HomePage() {
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('featured');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const { default: api } = await import('../../utils/api');
        const res = await api.get('/stores');
        const data = res.data?.stores || res.data?.data || res.data || [];
        setStores(Array.isArray(data) ? data : []);
      } catch {
        setStores([]);
      }
      setLoading(false);
    };
    fetchStores();
  }, []);

  const list = Array.isArray(stores) ? stores : [];
  const filtered = list.filter((s) => {
    if (filter !== 'all' && s.category !== filter) return false;
    if (search && !s.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sort === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  return (
    <div className="px-4 max-w-2xl mx-auto space-y-6 pb-8" style={{ direction }}>
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          {t('app.name')}
        </h1>
      </div>

      <div className="relative">
        <svg className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${direction === 'rtl' ? 'right-4' : 'left-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('home.search.placeholder')}
          className={`w-full px-4 py-3 ${direction === 'rtl' ? 'pr-12' : 'pl-12'} rounded-2xl bg-white dark:bg-dark-light border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all`}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white dark:bg-dark-light text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary'
            }`}
          >
            {t(`home.filter.${f}`)}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {SORTS.map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sort === s
                ? 'bg-primary/10 text-primary'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t(`home.sort.${s}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} variant="store-card" />)}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title={t('home.noStores')}
          description={search ? t('common.noResults') : ''}
          actionLabel={t('home.addStore')}
          onAction={() => navigate('/register-store')}
        />
      ) : (
        <div className="space-y-4">
          {sorted.map((store) => (
            <StoreCard key={store._id} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}
