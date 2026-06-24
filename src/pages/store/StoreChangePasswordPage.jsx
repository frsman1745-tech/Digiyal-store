import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import BackButton from '../../components/ui/BackButton';

export default function StoreChangePasswordPage() {
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPass !== confirm) {
      setError(t('store.password.confirm') + ' mismatch');
      return;
    }
    if (newPass.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/store/change-password', { password: newPass });
      navigate('/store/dashboard');
    } catch {
      setError(t('common.error'));
    }
    setSubmitting(false);
  };

  return (
    <div className="px-4 max-w-sm mx-auto pt-20" style={{ direction }}>
      <div className="flex items-center gap-3 mb-4">
        <BackButton fallback="/store/dashboard" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">{t('store.password.change')}</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('store.password.new')}</label>
          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('store.password.confirm')}</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={submitting}
          className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-all"
        >
          {submitting ? t('common.loading') : t('store.password.save')}
        </button>
      </form>
    </div>
  );
}
