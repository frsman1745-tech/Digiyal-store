import { useLanguage } from '../../context/LanguageContext';

export default function Navbar({ onMenuToggle }) {
  const { direction } = useLanguage();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 bg-white/70 dark:bg-dark/70 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/40">
      <div className="h-full px-4 flex items-center justify-between" style={{ direction }}>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary tracking-tight">
            المنصة
          </span>
          <span className="hidden sm:inline text-xs text-gray-400 font-medium">
            Digital Store
          </span>
        </div>
        <button
          onClick={onMenuToggle}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-light transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
