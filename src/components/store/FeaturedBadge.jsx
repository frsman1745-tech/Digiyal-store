import { useLanguage } from '../../context/LanguageContext';

export default function FeaturedBadge() {
  const { direction } = useLanguage();
  const text = direction === 'rtl' ? 'مميز' : 'Featured';

  return (
    <div className="absolute top-0 left-0 z-10">
      <div className="relative">
        <svg className="w-16 h-16 text-secondary" viewBox="0 0 64 64" fill="currentColor">
          <path d="M0 0h64L0 64z" />
        </svg>
        <span className="absolute top-[6px] left-[6px] text-[9px] font-bold text-white uppercase tracking-wider" style={{ transform: 'rotate(-45deg)', transformOrigin: 'top left' }}>
          {text}
        </span>
      </div>
    </div>
  );
}
