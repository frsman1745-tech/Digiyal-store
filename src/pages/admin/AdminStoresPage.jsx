import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import {
  Search,
  AlertCircle,

  MoreVertical,
  Star,
  StarOff,
  Edit3,
  UserX,
  UserCheck,
  Trash2,
  X,
  ChevronDown,
  Package,
  HardDrive,
  AlertTriangle,
  Mail,
  Eye,
} from 'lucide-react';
import BackButton from '../../components/ui/BackButton';
import EmptyState from '../../components/ui/EmptyState';

const statuses = ['all', 'approved', 'suspended', 'pending'];
const plans = ['all', 'trial', 'basic', 'advanced', 'pro', 'custom'];

const statusStyles = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const planStyles = {
  trial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  basic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  pro: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(rating || 0) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ProductProgressBar({ current, max }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{current}/{max}</span>
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full max-w-[60px]">
        <div
          className={`h-1.5 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminStoresPage() {
  const { t, direction } = useTranslation();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [openMenu, setOpenMenu] = useState(null);
  const [editPlanStore, setEditPlanStore] = useState(null);
  const [editPlanData, setEditPlanData] = useState({ plan: '', productLimit: '', monthlyPrice: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (planFilter !== 'all') params.plan = planFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/admin/stores', { params });
      setStores(res.data.stores || res.data || []);
    } catch {
      setError(t('common.error'));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, [statusFilter, planFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStores();
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleFeatured = async (store) => {
    try {
      await api.put(`/admin/stores/${store._id || store.id}`, { isFeatured: !store.isFeatured });
      setStores((prev) =>
        prev.map((s) => (s._id === store._id || s.id === store.id ? { ...s, isFeatured: !s.isFeatured } : s))
      );
      showToast(t('admin.stores.featuredUpdated'));
    } catch {
      showToast(t('common.error'), 'error');
    }
  };

  const openSuspendModal = (store) => {
    setSuspendModal(store._id || store.id);
    setSuspendReason('');
    setOpenMenu(null);
  };

  const handleSuspendConfirm = async () => {
    const id = suspendModal;
    if (!id) return;
    try {
      await api.put(`/admin/stores/${id}`, { status: 'suspended', suspendReason, suspendedAt: new Date().toISOString() });
      setStores((prev) =>
        prev.map((s) => (s._id === id || s.id === id ? { ...s, status: 'suspended', suspendReason } : s))
      );
      showToast(t('admin.stores.suspendEmailSent'));
    } catch {
      showToast(t('common.error'), 'error');
    }
    setSuspendModal(null);
    setSuspendReason('');
  };

  const handleReactivate = async (store) => {
    const id = store._id || store.id;
    try {
      await api.put(`/admin/stores/${id}`, { status: 'approved', suspendReason: '' });
      setStores((prev) =>
        prev.map((s) => (s._id === id || s.id === id ? { ...s, status: 'approved', suspendReason: '' } : s))
      );
      showToast(t('admin.stores.reactivated'));
    } catch {
      showToast(t('common.error'), 'error');
    }
    setOpenMenu(null);
  };

  const handleDelete = async (store) => {
    if (!window.confirm(t('admin.stores.deleteConfirm'))) return;
    try {
      await api.delete(`/admin/stores/${store._id || store.id}`);
      setStores((prev) => prev.filter((s) => s._id !== store._id && s.id !== store.id));
      showToast(t('admin.stores.deleted'));
    } catch {
      showToast(t('common.error'), 'error');
    }
    setOpenMenu(null);
  };

  const openEditPlan = (store) => {
    setEditPlanStore(store);
    setEditPlanData({
      plan: store.plan || 'trial',
      productLimit: store.productLimit || '',
      monthlyPrice: store.monthlyPrice || '',
    });
    setOpenMenu(null);
  };

  const handleSavePlan = async () => {
    if (!editPlanStore) return;
    setSaving(true);
    try {
      await api.put(`/admin/stores/${editPlanStore._id || editPlanStore.id}`, {
        plan: editPlanData.plan,
        productLimit: editPlanData.plan === 'custom' ? Number(editPlanData.productLimit) : undefined,
        monthlyPrice: editPlanData.plan === 'custom' ? Number(editPlanData.monthlyPrice) : undefined,
      });
      setStores((prev) =>
        prev.map((s) =>
          s._id === editPlanStore._id || s.id === editPlanStore.id
            ? { ...s, plan: editPlanData.plan, productLimit: editPlanData.productLimit, monthlyPrice: editPlanData.monthlyPrice }
            : s
        )
      );
      showToast(t('admin.stores.planUpdated'));
      setEditPlanStore(null);
    } catch {
      showToast(t('common.error'), 'error');
    }
    setSaving(false);
  };

  const filtered = stores.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (planFilter !== 'all' && s.plan !== planFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (s.name || s.storeName || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-4 max-w-7xl mx-auto pb-8" style={{ direction }}>
      <Helmet>
        <title>{t('admin.stores.title')} - {t('app.name')}</title>
      </Helmet>

      <div className="flex items-center gap-3 mb-6">
        <BackButton fallback="/admin/dashboard" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t('admin.stores.title')}</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 flex-wrap">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-white dark:bg-dark-light shadow-sm text-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {status === 'all' ? t('home.filter.all') : t(`admin.stores.${status}`)}
            </button>
          ))}
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        >
          {plans.map((p) => (
            <option key={p} value={p}>
              {p === 'all' ? t('home.filter.all') : p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>

        <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-[200px]">
          <div className="relative flex-1">
            <Search size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Search size={18} />
          </button>
        </form>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-light rounded-2xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle size={48} className="text-danger mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchStores}
            className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={40} className="text-gray-300" />}
          title={t('common.noResults')}
          description={t('admin.stores.noStores') || 'No stores found matching your filters'}
        />
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-dark-light rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('register.storeName')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.stores.status')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.stores.plan')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.stores.products')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.stores.storage')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.stores.rating')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.stores.featured')}</th>
                    <th className="text-end px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.edit')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.map((store) => {
                    const storeId = store._id || store.id;
                    const isOpen = openMenu === storeId;
                    return (
                      <tr key={storeId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {store.logo ? (
                              <img src={store.logo} alt="" className="w-10 h-10 rounded-xl object-cover bg-gray-100" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-bold">
                                {(store.name || store.storeName || '?').charAt(0)}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {store.name || store.storeName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[store.status] || statusStyles.pending}`}>
                            {t(`admin.stores.${store.status}`) || store.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${planStyles[store.plan] || planStyles.trial}`}>
                            {(store.plan || 'trial').charAt(0).toUpperCase() + (store.plan || 'trial').slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ProductProgressBar current={store.productCount || 0} max={store.productLimit || 10} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <HardDrive size={13} />
                            {store.storageUsed ? (store.storageUsed / (1024 * 1024)).toFixed(0) : 0} MB
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StarRating rating={store.rating || 0} />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleFeatured(store)}
                            className={`p-1.5 rounded-lg transition-colors ${store.isFeatured ? 'text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-gray-300 dark:text-gray-600 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                            title={t('admin.stores.featured')}
                          >
                            {store.isFeatured ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-end relative">
                          <button
                            onClick={() => setOpenMenu(isOpen ? null : storeId)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <MoreVertical size={16} className="text-gray-500" />
                          </button>
                          {isOpen && (
                            <div
                              ref={menuRef}
                              className={`absolute ${direction === 'rtl' ? 'left-0' : 'right-0'} top-full mt-1 w-48 bg-white dark:bg-dark-light rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20`}
                            >
                              <button
                                onClick={() => { navigate(`/admin/stores/${storeId}`); setOpenMenu(null); }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <Eye size={15} /> {t('admin.stores.view') || 'View / Edit'}
                              </button>
                              <button
                                onClick={() => openEditPlan(store)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <Edit3 size={15} /> {t('admin.stores.editPlan')}
                              </button>
                              <button
                                onClick={() => { handleToggleFeatured(store); setOpenMenu(null); }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                {store.isFeatured ? <StarOff size={15} /> : <Star size={15} />}
                                {store.isFeatured ? t('admin.stores.unfeature') : t('admin.stores.feature')}
                              </button>
                              <button
                                onClick={() => store.status === 'suspended' ? handleReactivate(store) : openSuspendModal(store)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                {store.status === 'suspended' ? <UserCheck size={15} /> : <UserX size={15} />}
                                {store.status === 'suspended' ? t('admin.stores.reactivate') : t('admin.stores.suspend')}
                              </button>
                              <hr className="border-gray-200 dark:border-gray-700 my-1" />
                              <button
                                onClick={() => handleDelete(store)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 size={15} /> {t('admin.stores.delete')}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((store) => {
              const storeId = store._id || store.id;
              const isOpen = openMenu === storeId;
              return (
                <div key={storeId} className="bg-white dark:bg-dark-light rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {store.logo ? (
                        <img src={store.logo} alt="" className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-bold shrink-0">
                          {(store.name || store.storeName || '?').charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {store.name || store.storeName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[store.status] || statusStyles.pending}`}>
                            {t(`admin.stores.${store.status}`) || store.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${planStyles[store.plan] || planStyles.trial}`}>
                            {(store.plan || 'trial').charAt(0).toUpperCase() + (store.plan || 'trial').slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(isOpen ? null : storeId)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <MoreVertical size={16} className="text-gray-500" />
                      </button>
                      {isOpen && (
                        <div
                          ref={menuRef}
                          className={`absolute ${direction === 'rtl' ? 'left-0' : 'right-0'} top-full mt-1 w-48 bg-white dark:bg-dark-light rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20`}
                        >
                          <button onClick={() => { navigate(`/admin/stores/${storeId}`); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <Eye size={15} /> {t('admin.stores.view') || 'View / Edit'}
                          </button>
                          <button onClick={() => openEditPlan(store)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <Edit3 size={15} /> {t('admin.stores.editPlan')}
                          </button>
                          <button onClick={() => { handleToggleFeatured(store); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            {store.isFeatured ? <StarOff size={15} /> : <Star size={15} />}
                            {store.isFeatured ? t('admin.stores.unfeature') : t('admin.stores.feature')}
                          </button>
                          <button onClick={() => store.status === 'suspended' ? handleReactivate(store) : openSuspendModal(store)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            {store.status === 'suspended' ? <UserCheck size={15} /> : <UserX size={15} />}
                            {store.status === 'suspended' ? t('admin.stores.reactivate') : t('admin.stores.suspend')}
                          </button>
                          <hr className="border-gray-200 dark:border-gray-700 my-1" />
                          <button onClick={() => handleDelete(store)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 size={15} /> {t('admin.stores.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Package size={13} /> {t('admin.stores.products')}: <ProductProgressBar current={store.productCount || 0} max={store.productLimit || 10} />
                    </div>
                    <div className="flex items-center gap-1">
                      <HardDrive size={13} /> {t('admin.stores.storage')}: {store.storageUsed ? (store.storageUsed / (1024 * 1024)).toFixed(0) : 0} MB
                    </div>
                    <div className="flex items-center gap-1">
                      <StarRating rating={store.rating || 0} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleFeatured(store)}
                        className={`p-1 rounded-lg transition-colors ${store.isFeatured ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                      >
                        {store.isFeatured ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                      </button>
                      {store.isFeatured ? t('admin.stores.featured') : t('admin.stores.notFeatured')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {editPlanStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-dark-light rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{t('admin.stores.editPlan')}</h3>
              <button onClick={() => setEditPlanStore(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('admin.stores.plan')}</label>
                <select
                  value={editPlanData.plan}
                  onChange={(e) => setEditPlanData({ ...editPlanData, plan: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                >
                  {['trial', 'basic', 'advanced', 'pro', 'custom'].map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              {editPlanData.plan === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('admin.stores.productLimit')}</label>
                    <input
                      type="number"
                      value={editPlanData.productLimit}
                      onChange={(e) => setEditPlanData({ ...editPlanData, productLimit: e.target.value })}
                      min="1"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('admin.stores.monthlyPrice')}</label>
                    <input
                      type="number"
                      value={editPlanData.monthlyPrice}
                      onChange={(e) => setEditPlanData({ ...editPlanData, monthlyPrice: e.target.value })}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditPlanStore(null)}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSavePlan}
                disabled={saving}
                className="flex-1 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-dark-light rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <AlertTriangle size={20} className="text-danger" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {t('admin.stores.suspendTitle')}
              </h3>
              <button onClick={() => setSuspendModal(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ms-auto">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('admin.stores.suspendReason')}
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
              placeholder="..."
            />
            <div className="flex items-center gap-2 mt-3 mb-4 text-xs text-gray-500 dark:text-gray-400">
              <Mail size={14} />
              {t('admin.stores.suspendEmailSent')}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSuspendModal(null)}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSuspendConfirm}
                className="flex-1 py-2.5 bg-danger text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <UserX size={16} />
                {t('admin.stores.suspend')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 end-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all animate-fade-in-up ${
            toast.type === 'error' ? 'bg-danger' : 'bg-accent'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
