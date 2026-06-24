import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';

export default function PlanLimitBar({ used, limit }) {
  const { direction } = useLanguage();
  const { t } = useTranslation();

  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  let barColor = 'bg-accent';
  let textColor = 'text-accent';
  if (percentage >= 80) {
    barColor = 'bg-danger';
    textColor = 'text-danger';
  } else if (percentage >= 60) {
    barColor = 'bg-secondary';
    textColor = 'text-secondary';
  }

  return (
    <div className="w-full space-y-2" style={{ direction }}>
      <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${textColor}`}>
          {t('store.usage', { used, limit })}
        </span>
        <span className="text-gray-400">{Math.round(percentage)}%</span>
      </div>
      {percentage >= 80 && (
        <p className="text-xs text-danger font-medium">
          {t('store.dashboard.upgrade')}
        </p>
      )}
    </div>
  );
}
