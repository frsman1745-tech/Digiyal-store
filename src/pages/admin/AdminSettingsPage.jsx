import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import { AlertCircle, Save, Loader2, AlertTriangle } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import BackButton from '../../components/ui/BackButton';

export default function AdminSettingsPage() {
  const { t, direction } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    platformNameAr: '',
    platformNameEn: '',
    defaultPlan: 'trial',
    defaultProductLimit: 10,
    maxImageSizeKb: 150,
    allowStoreRegistrations: true,
    maintenanceMode: false,
    ramadan: { active: false, startDate: '', endDate: '' },
    eid: { active: false },
    nationalDay: { active: false },
  });

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/settings');
      const s = res.data.settings || res.data || {};
      setForm({
        platformNameAr: s.platformNameAr || s.platformName?.ar || '',
        platformNameEn: s.platformNameEn || s.platformName?.en || '',
        defaultPlan: s.defaultPlan || 'trial',
        defaultProductLimit: s.defaultProductLimit ?? 10,
        maxImageSizeKb: s.maxImageSizeKb ?? 150,
        allowStoreRegistrations: s.allowStoreRegistrations ?? true,
        maintenanceMode: s.maintenanceMode ?? false,
        ramadan: {
          active: s.ramadan?.active ?? false,
          startDate: s.ramadan?.startDate || '',
          endDate: s.ramadan?.endDate || '',
        },
        eid: { active: s.eid?.active ?? false },
        nationalDay: { active: s.nationalDay?.active ?? false },
      });
    } catch {
      setError(t('common.error'));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', form);
      showToast(t('admin.settings.saved'));
    } catch {
      showToast(t('common.error'), 'error');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-4 max-w-3xl mx-auto pb-8 space-y-6" style={{ direction }}>
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-3xl mx-auto pb-8" style={{ direction }}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle size={48} className="text-danger mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchSettings}
            className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto pb-8" style={{ direction }}>
      <Helmet>
        <title>{t('admin.settings.title')} - {t('app.name')}</title>
      </Helmet>

      <div className="flex items-center gap-3 mb-6">
        <BackButton fallback="/admin/dashboard" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t('admin.settings.title')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('admin.settings.general')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('admin.settings.platformNameAr')}</label>
            <input
              type="text"
              value={form.platformNameAr}
              onChange={(e) => handleChange('platformNameAr', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('admin.settings.platformNameEn')}</label>
            <input
              type="text"
              value={form.platformNameEn}
              onChange={(e) => handleChange('platformNameEn', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('admin.settings.defaultPlan')}</label>
            <select
              value={form.defaultPlan}
              onChange={(e) => handleChange('defaultPlan', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            >
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('admin.settings.defaultProductLimit')}</label>
            <input
              type="number"
              value={form.defaultProductLimit}
              onChange={(e) => handleChange('defaultProductLimit', Number(e.target.value))}
              min="1"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('admin.settings.maxImageSizeKb')}</label>
            <input
              type="number"
              value={form.maxImageSizeKb}
              onChange={(e) => handleChange('maxImageSizeKb', Number(e.target.value))}
              min="50"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.settings.allowStoreRegistrations')}</label>
            <button
              type="button"
              onClick={() => handleChange('allowStoreRegistrations', !form.allowStoreRegistrations)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.allowStoreRegistrations ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.allowStoreRegistrations ? 'translate-x-6' : 'translate-x-0.5'} ${direction === 'rtl' ? '' : ''}`}
                style={{ [direction === 'rtl' ? 'right' : 'left']: form.allowStoreRegistrations ? '2px' : '2px' }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.settings.maintenanceMode')}</label>
              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 flex items-center gap-1">
                <AlertTriangle size={12} /> {t('admin.settings.maintenanceWarning')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('maintenanceMode', !form.maintenanceMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.maintenanceMode ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('admin.settings.seasonalTemplates')}</h2>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.settings.ramadan')}</span>
                <button
                  type="button"
                  onClick={() => handleNestedChange('ramadan', 'active', !form.ramadan.active)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.ramadan.active ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.ramadan.active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {form.ramadan.active && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('admin.settings.startDate')}</label>
                    <input
                      type="date"
                      value={form.ramadan.startDate}
                      onChange={(e) => handleNestedChange('ramadan', 'startDate', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('admin.settings.endDate')}</label>
                    <input
                      type="date"
                      value={form.ramadan.endDate}
                      onChange={(e) => handleNestedChange('ramadan', 'endDate', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.settings.eid')}</span>
              <button
                type="button"
                onClick={() => handleNestedChange('eid', 'active', !form.eid.active)}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.eid.active ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.eid.active ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.settings.nationalDay')}</span>
              <button
                type="button"
                onClick={() => handleNestedChange('nationalDay', 'active', !form.nationalDay.active)}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.nationalDay.active ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.nationalDay.active ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {t('common.save')}
          </button>
        </div>
      </form>

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
