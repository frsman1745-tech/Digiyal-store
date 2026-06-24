import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import {
  Save, Store, Package, HardDrive,
  Star, StarOff, X, Check, AlertCircle,
} from 'lucide-react';
import BackButton from '../../components/ui/BackButton';

const planOptions = ['trial', 'basic', 'advanced', 'pro', 'custom'];
const planDefaults = { trial: 10, basic: 50, advanced: 200, pro: 1000, custom: 10 };

export default function AdminStoreDetailPage() {
  const { t, direction } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    description: '',
    'contact.email': '',
    'contact.phone': '',
    'contact.whatsapp': '',
    'location.city': '',
    'location.area': '',
    'location.address': '',
    status: 'approved',
    plan: 'trial',
    productLimit: 10,
    monthlyPrice: 0,
    isFeatured: false,
    category: 'other',
    slug: '',
  });
  const [storeStats, setStoreStats] = useState({ productCount: 0, storageUsedMB: 0 });

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get(`/admin/stores/${id}`);
        const s = res.data.store || res.data;
        setForm({
          name: s.name || s.storeName || '',
          nameEn: s.nameEn || '',
          description: s.description || '',
          'contact.email': s.contact?.email || s.email || '',
          'contact.phone': s.contact?.phone || s.phone || '',
          'contact.whatsapp': s.contact?.whatsapp || '',
          'location.city': s.location?.city || s.city || '',
          'location.area': s.location?.area || '',
          'location.address': s.location?.address || '',
          status: s.status || 'approved',
          plan: s.plan || 'trial',
          productLimit: s.productLimit || 10,
          monthlyPrice: s.monthlyPrice || 0,
          isFeatured: s.isFeatured || false,
          category: s.category || 'other',
          slug: s.slug || '',
        });
        setStoreStats({
          productCount: s.productCount || 0,
          storageUsedMB: s.storageUsedMB || 0,
        });
      } catch {
        setError(t('common.error'));
      }
      setLoading(false);
    };
    fetchStore();
  }, [id]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlanChange = (plan) => {
    setForm((prev) => ({
      ...prev,
      plan,
      productLimit: planDefaults[plan] || 10,
      monthlyPrice: plan === 'custom' ? prev.monthlyPrice : 0,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/stores/${id}`, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(t('common.error'));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{ direction }}>
      <Helmet>
        <title>{t('admin.stores.title')} - {form.name} - {t('app.name')}</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton fallback="/admin/stores" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              <Store size={22} className="text-primary" /> {form.name}
            </h1>
            <p className="text-sm text-gray-500">{t('admin.stores.title')} — {t('common.edit')}</p>
          </div>
        </div>

        {/* Alerts */}
        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
            <Check size={16} /> {t('admin.stores.planUpdated')}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-dark-light rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-1">{t('admin.stores.products')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-1">
              <Package size={16} className="text-primary" /> {storeStats.productCount}
            </p>
          </div>
          <div className="bg-white dark:bg-dark-light rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-1">{t('admin.stores.storage')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-1">
              <HardDrive size={16} className="text-primary" /> {(storeStats.storageUsedMB / 1024).toFixed(1)} GB
            </p>
          </div>
          <div className="bg-white dark:bg-dark-light rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-1">{t('admin.stores.plan')}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
              {form.plan.charAt(0).toUpperCase() + form.plan.slice(1)}
            </p>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              {t('register.storeName')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('register.storeName')} (AR)</label>
                <input type="text" value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('register.storeName')} (EN)</label>
                <input type="text" value={form.nameEn}
                  onChange={(e) => handleChange('nameEn', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">الوصف / Description</label>
                <textarea value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Slug (الرابط)</label>
                <input type="text" value={form.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none font-mono text-xs" />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              {t('register.email')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('register.email')}</label>
                <input type="email" value={form['contact.email']}
                  onChange={(e) => handleChange('contact.email', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('register.phone')}</label>
                <input type="text" value={form['contact.phone']}
                  onChange={(e) => handleChange('contact.phone', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp</label>
                <input type="text" value={form['contact.whatsapp']}
                  onChange={(e) => handleChange('contact.whatsapp', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('register.city')}</label>
                <input type="text" value={form['location.city']}
                  onChange={(e) => handleChange('location.city', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">المنطقة / Area</label>
                <input type="text" value={form['location.area']}
                  onChange={(e) => handleChange('location.area', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">العنوان / Address</label>
                <input type="text" value={form['location.address']}
                  onChange={(e) => handleChange('location.address', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
              </div>
            </div>
          </div>

          {/* Plan & Status */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              {t('admin.stores.plan')} & {t('admin.stores.status')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('admin.stores.plan')}</label>
                <select value={form.plan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
                  {planOptions.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('admin.stores.status')}</label>
                <select value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
                  <option value="approved">{t('admin.stores.approved') || 'Approved'}</option>
                  <option value="suspended">{t('admin.stores.suspend')}</option>
                  <option value="pending">{t('admin.registrations.pending')}</option>
                </select>
              </div>
              {form.plan === 'custom' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('admin.stores.productLimit')}</label>
                    <input type="number" value={form.productLimit}
                      onChange={(e) => handleChange('productLimit', e.target.value)}
                      min="1"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('admin.stores.monthlyPrice')}</label>
                    <input type="number" value={form.monthlyPrice}
                      onChange={(e) => handleChange('monthlyPrice', e.target.value)}
                      min="0" step="0.01"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                  </div>
                </>
              )}
              {form.plan !== 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('admin.stores.customLimit')}</label>
                  <input type="number" value={form.productLimit}
                    onChange={(e) => handleChange('productLimit', Number(e.target.value))}
                    min="1"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
                </div>
              )}
            </div>
          </div>

          {/* Featured & Category */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              {t('admin.stores.featured')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 pt-2">
                <button type="button"
                  onClick={() => handleChange('isFeatured', !form.isFeatured)}
                  className={`p-2 rounded-xl transition-colors ${
                    form.isFeatured
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                  }`}>
                  {form.isFeatured ? <Star size={20} fill="currentColor" /> : <StarOff size={20} />}
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {form.isFeatured ? t('admin.stores.featured') : t('admin.stores.notFeatured')}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">التصنيف / Category</label>
                <select value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
                  <option value="grocery">بقالة</option>
                  <option value="supermarket">سوبرماركت</option>
                  <option value="minimarket">ميني ماركت</option>
                  <option value="organic">عضوي</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button onClick={() => navigate('/admin/stores')}
            className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save size={18} />}
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
