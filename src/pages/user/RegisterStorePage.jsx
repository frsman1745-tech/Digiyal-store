import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';

const STORE_TYPES = ['grocery', 'supermarket', 'minimarket', 'organic'];

export default function RegisterStorePage() {
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const [form, setForm] = useState({ storeName: '', ownerName: '', email: '', phone: '', city: '', storeType: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/registrations', form);
      setSuccess(true);
    } catch {
      setError(t('register.error'));
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="px-4 max-w-lg mx-auto pt-20 text-center" style={{ direction }}>
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('register.success')}</h2>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-lg mx-auto pt-6 pb-8" style={{ direction }}>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">{t('register.title')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label={t('register.storeName')} value={form.storeName} onChange={handleChange('storeName')} required />
        <InputField label={t('register.ownerName')} value={form.ownerName} onChange={handleChange('ownerName')} required />
        <InputField label={t('register.email')} type="email" value={form.email} onChange={handleChange('email')} required />
        <InputField label={t('register.phone')} type="tel" value={form.phone} onChange={handleChange('phone')} required />
        <InputField label={t('register.city')} value={form.city} onChange={handleChange('city')} required />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.storeType')}</label>
          <select value={form.storeType} onChange={handleChange('storeType')} required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option value="">--</option>
            {STORE_TYPES.map((type) => (
              <option key={type} value={type}>{t(`home.filter.${type}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('register.message')}</label>
          <textarea value={form.message} onChange={handleChange('message')} rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? t('common.loading') : t('register.submit')}
        </button>
      </form>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input type={type} value={value} onChange={onChange} required={required}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
      />
    </div>
  );
}
