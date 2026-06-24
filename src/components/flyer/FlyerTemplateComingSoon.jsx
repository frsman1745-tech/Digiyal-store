export default function FlyerTemplateComingSoon({ language }) {
  const isRtl = language === 'ar';

  return (
    <div className="bg-gray-100 border-2 border-dashed border-gray-300 opacity-50 pointer-events-none select-none font-sans">
      <div className="flex flex-col items-center justify-center min-h-[400px] p-12 text-center">
        <svg className="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-2xl font-bold text-gray-400 mb-2">
          {isRtl ? 'قريباً' : 'Coming Soon'}
        </p>
        <p className="text-sm text-gray-400">
          {isRtl ? 'هذا القالب قيد التطوير' : 'This template is under development'}
        </p>
      </div>
    </div>
  );
}
