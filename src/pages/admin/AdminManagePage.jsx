import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useAdminAuth } from '../../hooks/useAuth';
import BackButton from '../../components/ui/BackButton';
import { Shield, UserPlus, Trash2, AlertCircle, X, Check } from 'lucide-react';

const ROLE_LABELS = {
  super_admin: { ar: 'مشرف عام', en: 'Super Admin' },
  admin: { ar: 'مشرف', en: 'Admin' },
  moderator: { ar: 'مشرف مساعد', en: 'Moderator' },
  viewer: { ar: 'مشاهد', en: 'Viewer' },
};

const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  moderator: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export default function AdminManagePage() {
  const { t, direction } = useTranslation();
  const { language } = useLanguage();
  const { adminRole } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'admin' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { default: api } = await import('../../utils/api');
      const res = await api.get('/admin/admins');
      setAdmins(res.data.admins);
    } catch {}
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/admin/admins', form);
      setShowAdd(false);
      setForm({ email: '', name: '', password: '', role: 'admin' });
      await fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    }
    setSubmitting(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`${language === 'ar' ? 'هل أنت متأكد من حذف' : 'Are you sure you want to delete'} "${name}"?`)) return;
    try {
      const { default: api } = await import('../../utils/api');
      await api.delete(`/admin/admins?id=${id}`);
      await fetchAdmins();
    } catch {}
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      const { default: api } = await import('../../utils/api');
      await api.put(`/admin/admins?id=${id}`, { role: newRole });
      await fetchAdmins();
    } catch {}
  };

  if (adminRole !== 'super_admin') {
    return (
      <div className="p-4 max-w-2xl mx-auto pb-8 text-center pt-20" style={{ direction }}>
        <Shield size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{language === 'ar' ? 'ليس لديك صلاحية الوصول لهذه الصفحة' : 'You do not have permission to access this page'}</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto pb-8" style={{ direction }}>
      <Helmet>
        <title>{language === 'ar' ? 'إدارة المشرفين' : 'Admin Management'} - Digital Store</title>
      </Helmet>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton fallback="/admin/dashboard" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {language === 'ar' ? 'إدارة المشرفين' : 'Admin Management'}
          </h1>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
        >
          <UserPlus size={18} />
          {language === 'ar' ? 'إضافة مشرف' : 'Add Admin'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <div key={admin._id} className="flex items-center justify-between p-4 bg-white dark:bg-dark-light rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-gray-50 truncate">{admin.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ROLE_COLORS[admin.role] || ROLE_COLORS.admin}`}>
                    {(ROLE_LABELS[admin.role] || ROLE_LABELS.admin)[language] || admin.role}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{admin.email}</p>
              </div>
              {adminRole === 'super_admin' && admin._id !== admins.find(a => a.role === 'super_admin')?._id && (
                <div className="flex items-center gap-2 shrink-0 ms-3">
                  <select value={admin.role} onChange={(e) => handleRoleChange(admin._id, e.target.value)}
                    className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {Object.keys(ROLE_LABELS).map((r) => (
                      <option key={r} value={r}>{(ROLE_LABELS[r])[language] || r}</option>
                    ))}
                  </select>
                  <button onClick={() => handleDelete(admin._id, admin.name)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                    title={language === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {admins.length === 0 && (
            <p className="text-center text-gray-400 py-8">{language === 'ar' ? 'لا يوجد مشرفين' : 'No admins found'}</p>
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {language === 'ar' ? 'إضافة مشرف جديد' : 'Add New Admin'}
              </h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'ar' ? 'الاسم' : 'Name'}
                </label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'ar' ? 'الصلاحية' : 'Role'}
                </label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                >
                  {Object.keys(ROLE_LABELS).map((r) => (
                    <option key={r} value={r}>{(ROLE_LABELS[r])[language] || r}</option>
                  ))}
                </select>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-danger">
                  <AlertCircle size={16} /><span>{error}</span>
                </div>
              )}
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {language === 'ar' ? 'جاري...' : 'Saving...'}</>
                ) : (
                  <><Check size={18} /> {language === 'ar' ? 'إضافة' : 'Add'}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
