import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import PlanLimitBar from '../../components/ui/PlanLimitBar';
import BackButton from '../../components/ui/BackButton';

export default function StoreDashboardPage() {
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ productsUsed: 0, limit: 50, activeOffers: 0, storageUsed: '0 MB' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { default: api } = await import('../../utils/api');
        const res = await api.get('/store/dashboard');
        setStats(res.data);
      } catch {}
      setLoading(false);
    };
    fetchStats();
  }, []);

  const quickActions = [
    { label: t('store.dashboard.addProduct'), path: '/store/products/new', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', color: 'bg-primary' },
    { label: t('store.dashboard.editFlyer'), path: '/store/flyer', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', color: 'bg-secondary' },
    { label: t('store.dashboard.viewFlyer'), path: '/store/flyer', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z', color: 'bg-accent' },
    { label: t('store.products.title'), path: '/store/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'bg-purple-500' },
  ];

  return (
    <div className="px-4 max-w-2xl mx-auto space-y-6 pb-8" style={{ direction }}>
      <div className="pt-6 flex items-center gap-3">
        <BackButton fallback="/" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t('store.dashboard.title')}</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('store.dashboard.productsUsed'), value: loading ? '...' : `${stats.productsUsed}/${stats.limit}` },
          { label: t('store.dashboard.activeOffers'), value: loading ? '...' : stats.activeOffers },
          { label: t('store.dashboard.storageUsed'), value: loading ? '...' : stats.storageUsed },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-dark-light rounded-2xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <PlanLimitBar used={stats.productsUsed} limit={stats.limit} />

      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('store.dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-3 p-4 bg-white dark:bg-dark-light rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all"
            >
              <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center shrink-0`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
