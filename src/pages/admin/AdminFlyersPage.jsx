import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import BackButton from '../../components/ui/BackButton';
import { FileText, Calendar } from 'lucide-react';

const STATUS_LABELS = {
  ar: { draft: 'مسودة', scheduled: 'مجدول', active: 'نشط', expired: 'منتهي' },
  en: { draft: 'Draft', scheduled: 'Scheduled', active: 'Active', expired: 'Expired' },
};

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminFlyersPage() {
  const { direction, language } = useLanguage();
  const [flyers, setFlyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchFlyers();
  }, [statusFilter]);

  const fetchFlyers = async () => {
    try {
      const { default: api } = await import('../../utils/api');
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/flyers', { params });
      setFlyers(res.data.flyers);
      setTotal(res.data.total);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto pb-8" style={{ direction }}>
      <Helmet>
        <title>{language === 'ar' ? 'إدارة الفلايرات' : 'Flyers Management'} - Digital Store</title>
      </Helmet>

      <div className="flex items-center gap-3 mb-6">
        <BackButton fallback="/admin/dashboard" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 flex-1">
          {language === 'ar' ? 'إدارة الفلايرات' : 'Flyers Management'}
        </h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-dark-light text-gray-700 dark:text-gray-300"
        >
          <option value="">{language === 'ar' ? 'الكل' : 'All'}</option>
          {Object.keys(STATUS_LABELS.ar).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[language][s]}</option>
          ))}
        </select>
      </div>

      <div className="mb-4 text-sm text-gray-500">
        {language === 'ar' ? `إجمالي الفلايرات: ${total}` : `Total flyers: ${total}`}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {flyers.map((flyer) => (
            <div key={flyer._id} className="flex items-center gap-4 p-4 bg-white dark:bg-dark-light rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText size={22} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {flyer.storeId?.name || (language === 'ar' ? 'متجر' : 'Store')}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[flyer.status] || STATUS_COLORS.draft}`}>
                    {(STATUS_LABELS[language]?.[flyer.status] || flyer.status)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {flyer.startDate ? new Date(flyer.startDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '—'}
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {flyer.endDate ? new Date(flyer.endDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '—'}
                  </span>
                  {flyer.products?.length > 0 && (
                    <span>{flyer.products.length} {language === 'ar' ? 'منتج' : 'products'}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {flyers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText size={48} className="mb-3" />
              <p className="text-sm">{language === 'ar' ? 'لا توجد فلايرات' : 'No flyers found'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
