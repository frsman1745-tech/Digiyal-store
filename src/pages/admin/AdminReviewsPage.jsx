import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useAdminAuth } from '../../hooks/useAuth';
import BackButton from '../../components/ui/BackButton';
import { Star, Trash2, MessageSquare } from 'lucide-react';

export default function AdminReviewsPage() {
  const { direction, language } = useLanguage();
  const { adminPermissions } = useAdminAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const canDelete = adminPermissions.includes('manage_reviews');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { default: api } = await import('../../utils/api');
      const res = await api.get('/admin/reviews', { params: { limit: 100 } });
      setReviews(res.data.reviews);
      setTotal(res.data.total);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا التقييم؟' : 'Delete this review?')) return;
    try {
      const { default: api } = await import('../../utils/api');
      await api.delete(`/admin/reviews?id=${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      setTotal((prev) => prev - 1);
    } catch {}
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-8" style={{ direction }}>
      <Helmet>
        <title>{language === 'ar' ? 'إدارة التقييمات' : 'Reviews Management'} - Digital Store</title>
      </Helmet>

      <div className="flex items-center gap-3 mb-6">
        <BackButton fallback="/admin/dashboard" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          {language === 'ar' ? 'إدارة التقييمات' : 'Reviews Management'}
        </h1>
        <span className="text-sm text-gray-500">({total})</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review._id} className="flex items-start gap-4 p-4 bg-white dark:bg-dark-light rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquare size={18} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {review.userName || (language === 'ar' ? 'مستخدم' : 'Anonymous')}
                  </p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className={s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                {review.storeId && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {language === 'ar' ? 'متجر' : 'Store'}: {review.storeId?.name || review.storeId}
                  </p>
                )}
                {review.comment && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{review.comment}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(review.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
              </div>
              {canDelete && (
                <button onClick={() => handleDelete(review._id)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors shrink-0"
                  title={language === 'ar' ? 'حذف' : 'Delete'}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Star size={48} className="mb-3" />
              <p className="text-sm">{language === 'ar' ? 'لا توجد تقييمات' : 'No reviews found'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
