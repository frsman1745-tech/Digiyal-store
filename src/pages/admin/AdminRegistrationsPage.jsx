import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '../../hooks/useTranslation';
import { Check, X, Search, AlertCircle, Mail, Package, DollarSign } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import BackButton from '../../components/ui/BackButton';

const statusTabs = ['all', 'pending', 'approved', 'rejected'];

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const planOptions = ['trial', 'basic', 'advanced', 'pro', 'custom'];
const planDefaults = { trial: 10, basic: 50, advanced: 200, pro: 1000, custom: 10 };
const planPrices = { trial: 0, basic: 29, advanced: 79, pro: 199, custom: 0 };

export default function AdminRegistrationsPage() {
  const { t, direction } = useTranslation();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [toast, setToast] = useState(null);

  // Approve modal state
  const [approveModal, setApproveModal] = useState(null);
  const [approveData, setApproveData] = useState({
    plan: 'trial',
    storeName: '',
    productLimit: 10,
    monthlyPrice: 0,
    adminNote: '',
    sendEmail: true,
    password: '',
  });

  const fetchRegistrations = async () => {
    setLoading(true);
    setError('');
    try {
      const { default: api } = await import('../../utils/api');
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/admin/registrations', { params });
      setRegistrations(res.data.registrations || res.data || []);
    } catch (err) {
      setError(t('common.error'));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRegistrations();
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openApprove = (reg) => {
    setApproveModal(reg._id || reg.id);
    setApproveData({
      plan: 'trial',
      storeName: reg.storeName || '',
      productLimit: 10,
      monthlyPrice: 0,
      adminNote: '',
      sendEmail: true,
      password: '',
    });
  };

  const handleApproveConfirm = async () => {
    const id = approveModal;
    if (!id) return;
    setActionLoading(id);
    try {
      const { default: api } = await import('../../utils/api');
      const password = approveData.password?.trim() || undefined;
      if (password && password.length < 6) {
        showToast(t('admin.registrations.passwordTooShort') || 'Password must be at least 6 characters', 'error');
        setActionLoading(null);
        return;
      }
      await api.put(`/admin/registrations/${id}`, {
        action: 'approve',
        plan: approveData.plan,
        storeName: approveData.storeName,
        productLimit: approveData.plan === 'custom' ? Number(approveData.productLimit) : undefined,
        monthlyPrice: approveData.plan === 'custom' ? Number(approveData.monthlyPrice) : undefined,
        adminNote: approveData.adminNote,
        sendEmail: approveData.sendEmail,
        password: password,
      });
      showToast(t('admin.registrations.approveSuccess'));
      setRegistrations((prev) =>
        prev.map((r) => (r._id === id || r.id === id ? { ...r, status: 'approved' } : r))
      );
    } catch {
      showToast(t('common.error'), 'error');
    }
    setActionLoading(null);
    setApproveModal(null);
  };

  const handlePlanChange = (plan) => {
    setApproveData((prev) => ({
      ...prev,
      plan,
      productLimit: planDefaults[plan] || 10,
      monthlyPrice: planPrices[plan] || 0,
    }));
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal);
    try {
      const { default: api } = await import('../../utils/api');
      await api.put(`/admin/registrations/${rejectModal}`, {
        action: 'reject',
        adminNote: rejectNote,
      });
      showToast(t('admin.registrations.rejectSuccess'));
      setRegistrations((prev) =>
        prev.map((r) => (r._id === rejectModal || r.id === rejectModal ? { ...r, status: 'rejected' } : r))
      );
    } catch {
      showToast(t('common.error'), 'error');
    }
    setActionLoading(null);
    setRejectModal(null);
    setRejectNote('');
  };

  const filtered = registrations.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (r.storeName || '').toLowerCase().includes(q) ||
        (r.ownerName || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 max-w-7xl mx-auto pb-8" style={{ direction }}>
      <Helmet>
        <title>{t('admin.registrations.title')} - {t('app.name')}</title>
      </Helmet>

      <div className="flex items-center gap-3 mb-6">
        <BackButton fallback="/admin/dashboard" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t('admin.registrations.title')}</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === tab
                  ? 'bg-white dark:bg-dark-light shadow-sm text-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'all' ? t('home.filter.all') : t(`admin.registrations.${tab}`)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
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
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-dark-light rounded-2xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse"
            >
              <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle size={48} className="text-danger mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchRegistrations}
            className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title={t('common.noResults')}
          description={t('admin.registrations.noPending') || 'No registration requests found'}
        />
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-dark-light rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('register.storeName')}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('register.ownerName')}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('register.email')}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('register.city')}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('register.storeType')}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.logs.date')}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('admin.stores.status')}
                    </th>
                    <th className="text-end px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('common.edit')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.map((reg) => (
                    <tr key={reg._id || reg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {reg.storeName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{reg.ownerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{reg.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{reg.city}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{reg.storeType}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(reg.createdAt || reg.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[reg.status] || statusStyles.pending}`}>
                          {t(`admin.registrations.${reg.status}`) || reg.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        {reg.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openApprove(reg)}
                              disabled={actionLoading === (reg._id || reg.id)}
                              className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 disabled:opacity-50 transition-colors"
                              title={t('admin.registrations.approve')}
                            >
                              {actionLoading === (reg._id || reg.id) ? (
                                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Check size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => setRejectModal(reg._id || reg.id)}
                              disabled={actionLoading === (reg._id || reg.id)}
                              className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                              title={t('admin.registrations.reject')}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                        {reg.status !== 'pending' && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[reg.status] || statusStyles.pending}`}>
                            {t(`admin.registrations.${reg.status}`) || reg.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((reg) => (
              <div
                key={reg._id || reg.id}
                className="bg-white dark:bg-dark-light rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{reg.storeName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{reg.ownerName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[reg.status] || statusStyles.pending}`}>
                    {t(`admin.registrations.${reg.status}`) || reg.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>{t('register.email')}: {reg.email}</p>
                  <p>{t('register.city')}: {reg.city}</p>
                  <p>{t('register.storeType')}: {reg.storeType}</p>
                  <p>{t('admin.logs.date')}: {new Date(reg.createdAt || reg.date).toLocaleDateString()}</p>
                </div>
                {reg.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openApprove(reg)}
                      disabled={actionLoading === (reg._id || reg.id)}
                      className="flex-1 py-2 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                    >
                      {actionLoading === (reg._id || reg.id) ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      {t('admin.registrations.approve')}
                    </button>
                    <button
                      onClick={() => setRejectModal(reg._id || reg.id)}
                      disabled={actionLoading === (reg._id || reg.id)}
                      className="flex-1 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <X size={16} />
                      {t('admin.registrations.reject')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {approveModal && (() => {
        const reg = registrations.find((r) => (r._id || r.id) === approveModal);
        if (!reg) return null;
        const planInfo = planDefaults[approveData.plan] || 10;
        const priceInfo = planPrices[approveData.plan] || 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-dark-light rounded-2xl p-6 w-full max-w-lg border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t('admin.registrations.approveTitle')}
                </h3>
                <button onClick={() => setApproveModal(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              {/* Full registration details */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('register.storeName')}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{reg.storeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('register.ownerName')}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{reg.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('register.email')}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{reg.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('register.phone')}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{reg.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('register.city')}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{reg.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('register.storeType')}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{reg.storeType || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('admin.logs.date')}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(reg.createdAt || reg.date).toLocaleDateString()}</span>
                </div>
                {reg.message && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400 block mb-1">{t('register.message')}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{reg.message}</span>
                  </div>
                )}
              </div>

              {/* Editable store name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('admin.registrations.editStoreName')}
                </label>
                <input
                  type="text"
                  value={approveData.storeName}
                  onChange={(e) => setApproveData((prev) => ({ ...prev, storeName: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Plan selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin.registrations.selectPlan')}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {planOptions.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePlanChange(p)}
                      className={`px-2 py-2 rounded-xl text-xs font-medium border transition-all ${
                        approveData.plan === p
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white dark:bg-dark-light text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-primary/50'
                      }`}
                    >
                      {t(`admin.registrations.plan${p.charAt(0).toUpperCase() + p.slice(1)}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan summary */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                  {t('admin.registrations.planSummary')}
                </p>
                <div className="flex items-center gap-4 text-sm text-emerald-600 dark:text-emerald-300">
                  <span className="flex items-center gap-1">
                    <Package size={14} />
                    {planInfo} {t('admin.registrations.planProducts')}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign size={14} />
                    {priceInfo === 0 ? t('admin.registrations.free') : `$${priceInfo} ${t('admin.registrations.planPrice')}`}
                  </span>
                </div>
              </div>

              {/* Custom plan extra fields */}
              {approveData.plan === 'custom' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('admin.registrations.productLimit')}
                    </label>
                    <input
                      type="number"
                      value={approveData.productLimit}
                      onChange={(e) => setApproveData((prev) => ({ ...prev, productLimit: e.target.value }))}
                      min="1"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('admin.registrations.monthlyPrice')}
                    </label>
                    <input
                      type="number"
                      value={approveData.monthlyPrice}
                      onChange={(e) => setApproveData((prev) => ({ ...prev, monthlyPrice: e.target.value }))}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Admin note */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('admin.registrations.adminNote')}
                </label>
                <textarea
                  value={approveData.adminNote}
                  onChange={(e) => setApproveData((prev) => ({ ...prev, adminNote: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('admin.registrations.password') || 'Password'} ({t('admin.registrations.optional') || 'optional'})
                </label>
                <input
                  type="text"
                  value={approveData.password}
                  onChange={(e) => setApproveData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder={t('admin.registrations.passwordPlaceholder') || 'تركه فارغاً لإنشاء كلمة مرور تلقائية'}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t('admin.registrations.passwordHint') || '6 أحرف أو أكثر - إذا تركته فارغاً سيتم إنشاء كلمة مرور تلقائية'}
                </p>
              </div>

              {/* Send email toggle */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setApproveData((prev) => ({ ...prev, sendEmail: !prev.sendEmail }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    approveData.sendEmail ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      approveData.sendEmail ? 'translate-x-[22px]' : 'translate-x-[2px]'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Mail size={14} />
                  {t('admin.registrations.sendEmail')}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setApproveModal(null)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleApproveConfirm}
                  disabled={actionLoading === approveModal}
                  className="flex-1 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === approveModal ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {t('admin.registrations.approve')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-dark-light rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
              {t('admin.registrations.reject')}
            </h3>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.registrations.adminNote')}
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none"
              placeholder={t('admin.registrations.adminNote')}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectNote('');
                }}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal}
                className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading === rejectModal ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                {t('admin.registrations.reject')}
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
