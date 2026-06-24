import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '../../hooks/useTranslation';
import { Store, Users, ShoppingBag, BarChart3, Clock, AlertCircle, Check, X, Shield, Star, FileText } from 'lucide-react';
import BackButton from '../../components/ui/BackButton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const statCards = [
  { key: 'totalStores', labelKey: 'admin.dashboard.totalStores', icon: Store, color: 'bg-blue-500', link: '/admin/stores' },
  { key: 'pendingRegistrations', labelKey: 'admin.dashboard.pendingRegistrations', icon: Clock, color: 'bg-amber-500', link: '/admin/registrations' },
  { key: 'approvedStores', labelKey: 'admin.dashboard.approvedStores', icon: Check, color: 'bg-emerald-500', link: '/admin/stores' },
  { key: 'suspendedStores', labelKey: 'admin.dashboard.suspendedStores', icon: X, color: 'bg-red-500', link: '/admin/stores' },
  { key: 'totalProducts', labelKey: 'admin.dashboard.totalProducts', icon: ShoppingBag, color: 'bg-purple-500', link: '/admin/products' },
  { key: 'totalStorage', labelKey: 'admin.dashboard.totalStorage', icon: BarChart3, color: 'bg-indigo-500', link: '/admin/stores' },
];

const planColors = {
  trial: '#f59e0b',
  basic: '#3b82f6',
  advanced: '#8b5cf6',
  pro: '#10b981',
};

export default function AdminDashboardPage() {
  const { t, direction } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { default: api } = await import('../../utils/api');
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err) {
        setError(t('common.error'));
      }
      setLoading(false);
    };
    fetchStats();
  }, [t]);

  if (loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto space-y-6 pb-8" style={{ direction }}>
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-light rounded-2xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 mb-3" />
              <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-7xl mx-auto pb-8" style={{ direction }}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle size={48} className="text-danger mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  const lineChartData = {
    labels: (stats?.newStoresPerWeek || []).map((d) => d.week || d.label),
    datasets: [
      {
        label: t('admin.dashboard.chartNewStores'),
        data: (stats?.newStoresPerWeek || []).map((d) => d.count),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const barChartData = {
    labels: (stats?.topStoresByViews || []).map((d) => d.name),
    datasets: [
      {
        label: t('admin.dashboard.chartTopStores'),
        data: (stats?.topStoresByViews || []).map((d) => d.views),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  const planDist = stats?.planDistribution || { trial: 0, basic: 0, advanced: 0, pro: 0 };
  const doughnutData = {
    labels: Object.keys(planDist).map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [
      {
        data: Object.values(planDist),
        backgroundColor: Object.keys(planDist).map((k) => planColors[k]),
        borderWidth: 0,
      },
    ],
  };

  const recentRegistrations = stats?.recentRegistrations || [];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6 pb-8" style={{ direction }}>
      <Helmet>
        <title>{t('admin.dashboard.title')} - {t('app.name')}</title>
      </Helmet>

      <div className="flex items-center gap-3 mb-6">
        <BackButton fallback="/" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t('admin.dashboard.title')}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const value = stats?.[card.key] ?? 0;
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              onClick={() => navigate(card.link)}
              className="bg-white dark:bg-dark-light rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t(card.labelKey)}</p>
            </div>
          );
        })}
      </div>

      {/* Management Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Shield, label: t('admin.manageAdmins') || 'Admins', link: '/admin/admins', color: 'bg-purple-500' },
          { icon: ShoppingBag, label: t('admin.manageProducts') || 'Products', link: '/admin/products', color: 'bg-blue-500' },
          { icon: Star, label: t('admin.manageReviews') || 'Reviews', link: '/admin/reviews', color: 'bg-amber-500' },
          { icon: FileText, label: t('admin.manageFlyers') || 'Flyers', link: '/admin/flyers', color: 'bg-emerald-500' },
        ].map((item) => (
          <button key={item.link} onClick={() => navigate(item.link)}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-dark-light rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
              <item.icon size={20} className="text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('admin.dashboard.chartNewStores')}</h2>
          {lineChartData.labels?.length ? (
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                  x: { grid: { display: false } },
                },
              }}
              height={250}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">{t('common.noResults')}</div>
          )}
        </div>

        <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('admin.dashboard.chartTopStores')}</h2>
          {barChartData.labels?.length ? (
            <Bar
              data={barChartData}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                  y: { grid: { display: false } },
                },
              }}
              height={250}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">{t('common.noResults')}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('admin.dashboard.chartPlans')}</h2>
          <div className="flex justify-center">
            {Object.values(planDist).some((v) => v > 0) ? (
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' },
                    },
                  },
                  cutout: '65%',
                }}
                height={250}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">{t('common.noResults')}</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('admin.registrations.title')}</h2>
            <button
              onClick={() => navigate('/admin/registrations')}
              className="text-xs text-primary hover:underline"
            >
              {t('common.view')} {t('admin.registrations.title')}
            </button>
          </div>
          {recentRegistrations.length > 0 ? (
            <div className="space-y-3">
              {recentRegistrations.map((reg) => (
                <div
                  key={reg._id || reg.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {reg.storeName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{reg.ownerName} &middot; {reg.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ms-3">
                    {reg.status === 'pending' && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              const { default: api } = await import('../../utils/api');
                              await api.put(`/admin/registrations/${reg._id || reg.id}`, { action: 'approve' });
                              const res = await (await import('../../utils/api')).default.get('/admin/stats');
                              setStats(res.data);
                            } catch {}
                          }}
                          className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                          title={t('admin.registrations.approve')}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const { default: api } = await import('../../utils/api');
                              await api.put(`/admin/registrations/${reg._id || reg.id}`, { action: 'reject', adminNote: 'Rejected from dashboard' });
                              const res = await (await import('../../utils/api')).default.get('/admin/stats');
                              setStats(res.data);
                            } catch {}
                          }}
                          className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          title={t('admin.registrations.reject')}
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      reg.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      reg.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {t(`admin.registrations.${reg.status}`) || reg.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">{t('common.noResults')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
