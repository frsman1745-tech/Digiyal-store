import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import {
  AlertCircle,
  Search,
  X,

  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import BackButton from '../../components/ui/BackButton';

const actionTypes = [
  'all',
  'APPROVE_STORE',
  'REJECT_STORE',
  'SET_FEATURED',
  'CHANGE_PLAN',
  'SUSPEND_STORE',
  'REACTIVATE_STORE',
  'BROADCAST',
  'UPDATE_SETTINGS',
];

const actionColors = {
  APPROVE_STORE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECT_STORE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SET_FEATURED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CHANGE_PLAN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SUSPEND_STORE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REACTIVATE_STORE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  BROADCAST: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  UPDATE_SETTINGS: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function AdminLogsPage() {
  const { t, direction } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);

  const [filters, setFilters] = useState({
    admin: '',
    action: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [searchTriggered, setSearchTriggered] = useState(0);

  const fetchLogs = useCallback(async (pageNum = 1, append = false) => {
    if (!append) setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: 20 };
      if (filters.admin) params.admin = filters.admin;
      if (filters.action !== 'all') params.action = filters.action;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const res = await api.get('/admin/logs', { params });
      const data = res.data.logs || res.data || [];
      setLogs((prev) => (append ? [...prev, ...data] : data));
      setHasMore(data.length === 20);
    } catch {
      setError(t('common.error'));
    }
    setLoading(false);
  }, [filters, t]);

  useEffect(() => {
    fetchLogs(1);
  }, [searchTriggered]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchLogs(1);
      }, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchLogs]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    setSearchTriggered((prev) => prev + 1);
  };

  const handleClearFilters = () => {
    setFilters({ admin: '', action: 'all', dateFrom: '', dateTo: '' });
    setPage(1);
    setSearchTriggered((prev) => prev + 1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage, true);
  };

  const formatTimestamp = (ts) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts || '';
    }
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-4 max-w-7xl mx-auto pb-8" style={{ direction }}>
      <Helmet>
        <title>{t('admin.logs.title')} - {t('app.name')}</title>
      </Helmet>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton fallback="/admin/dashboard" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t('admin.logs.title')}</h1>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            autoRefresh
              ? 'bg-primary/10 text-primary'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          {autoRefresh ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {t('admin.logs.autoRefresh')}
        </button>
      </div>

      <div className="bg-white dark:bg-dark-light rounded-2xl p-4 border border-gray-200 dark:border-gray-700 mb-6">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <Filter size={14} /> {t('admin.logs.filters')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('admin.logs.admin')}</label>
              <select
                value={filters.admin}
                onChange={(e) => setFilters((prev) => ({ ...prev, admin: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              >
                <option value="">{t('home.filter.all')}</option>
                <option value="admin1">Admin 1</option>
                <option value="admin2">Admin 2</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('admin.logs.action')}</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              >
                {actionTypes.map((a) => (
                  <option key={a} value={a}>
                    {a === 'all' ? t('home.filter.all') : a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('admin.logs.dateFrom')}</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('admin.logs.dateTo')}</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-1.5"
            >
              <Search size={15} /> {t('common.search')}
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <X size={15} /> {t('common.clear')}
            </button>
            <button
              type="button"
              onClick={() => { setPage(1); fetchLogs(1); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={15} /> {t('common.refresh')}
            </button>
          </div>
        </form>
      </div>

      {loading && logs.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-light rounded-2xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
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
            onClick={() => fetchLogs(1)}
            className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Clock size={40} className="text-gray-300" />}
          title={t('common.noResults')}
          description={t('admin.logs.noLogs') || 'No audit logs found'}
        />
      ) : (
        <>
          <div className="bg-white dark:bg-dark-light rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.logs.timestamp')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.logs.admin')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.logs.action')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.logs.target')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.logs.ipAddress')}</th>
                    <th className="text-end px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('admin.logs.details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => {
                    const logId = log._id || log.id;
                    const isExpanded = expanded === logId;
                    return (
                      <tr key={logId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatTimestamp(log.timestamp || log.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {log.adminName || log.admin?.name || log.admin || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {log.targetName || log.target?.name || log.targetId || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
                          {log.ipAddress || log.ip || '-'}
                        </td>
                        <td className="px-4 py-3 text-end">
                          {log.details && Object.keys(log.details).length > 0 && (
                            <button
                              onClick={() => toggleExpand(logId)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={15} className="text-gray-500" /> : <ChevronDown size={15} className="text-gray-500" />}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {logs.map((log) => {
                    const logId = log._id || log.id;
                    if (expanded !== logId) return null;
                    return (
                      <tr key={`${logId}-details`} className="bg-gray-50 dark:bg-gray-800/30">
                        <td colSpan={6} className="px-4 py-3">
                          <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono bg-white dark:bg-dark-light rounded-xl p-3 border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-8 py-2.5 bg-white dark:bg-dark-light border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                ) : null}
                {t('admin.logs.loadMore')}
              </button>
            </div>
          )}
        </>
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
