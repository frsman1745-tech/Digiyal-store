import { useLanguage } from '../../context/LanguageContext';

export default function SkeletonCard({ variant = 'store-card' }) {
  const { direction } = useLanguage();

  if (variant === 'product-card') {
    return (
      <div className="animate-pulse bg-white dark:bg-dark-light rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ direction }}>
        <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        </div>
      </div>
    );
  }

  if (variant === 'product-detail') {
    return (
      <div className="animate-pulse space-y-6 p-4" style={{ direction }}>
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl max-w-sm mx-auto" />
        <div className="space-y-3 max-w-md mx-auto">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse bg-white dark:bg-dark-light rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ direction }}>
      <div className="flex gap-4 p-4">
        <div className="w-20 h-20 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}
