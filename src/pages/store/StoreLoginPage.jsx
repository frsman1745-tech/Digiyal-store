import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useStoreAuth } from '../../hooks/useAuth';

export default function StoreLoginPage() {
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const { login } = useStoreAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { default: api } = await import('../../utils/api');
      const res = await api.post('/store/login', { email, password });
      login(res.data.token);
      navigate('/store/dashboard');
    } catch (err) {
      if (err.response?.status === 423) setError(t('store.login.locked'));
      else setError(t('store.login.error'));
    }
    setSubmitting(false);
  };

  return (
    <div className="px-4 max-w-sm mx-auto pt-20" style={{ direction }}>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6 text-center">{t('store.login.title')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('store.login.email')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('store.login.password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
          />
        </div>
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        <button type="submit" disabled={submitting}
          className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-all"
        >
          {submitting ? t('common.loading') : t('store.login.submit')}
        </button>
      </form>
    </div>
  );
}
