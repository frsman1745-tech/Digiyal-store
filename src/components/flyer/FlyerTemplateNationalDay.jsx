export default function FlyerTemplateNationalDay({ store, products, language }) {
  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  const formatDate = (d) => d ? new Date(d).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const getName = (p) => isRtl ? p.name : (p.nameEn || p.name);

  const grouped = products.reduce((acc, p) => {
    const key = p.section?.sectionName || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const sortedSections = Object.entries(grouped).sort((a, b) =>
    (a[1][0]?.section?.sectionOrder || 99) - (b[1][0]?.section?.sectionOrder || 99)
  );

  return (
    <div dir={dir} className="bg-white font-sans">
      <div className="bg-[#006C35] text-white px-6 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="absolute text-2xl" style={{ top: `${5 + i * 12}%`, left: `${8 + i * 11}%` }}>🇸🇦</span>
          ))}
        </div>
        <span className="text-4xl block mb-2 relative">🇸🇦</span>
        <h1 className="text-3xl sm:text-4xl font-bold relative" style={{ fontFamily: "'Traditional Arabic', 'Scheherazade New', serif" }}>
          {isRtl ? 'اليوم الوطني' : 'National Day'}
        </h1>
        <div className="w-16 h-1 bg-white mx-auto my-2 rounded-full relative" />
        <h2 className="text-lg font-semibold relative">
          {isRtl ? store.name : (store.nameEn || store.name)}
        </h2>
        <p className="text-sm text-green-200 mt-1 relative">
          {isRtl
            ? `عروض من ${formatDate(store.currentFlyerStart)} إلى ${formatDate(store.currentFlyerEnd)}`
            : `Offers from ${formatDate(store.currentFlyerStart)} to ${formatDate(store.currentFlyerEnd)}`
          }
        </p>
      </div>

      <div className="p-6">
        {!products || products.length === 0 ? (
          <p className="text-center text-gray-400 py-12">
            {isRtl ? 'لا توجد منتجات' : 'No products available'}
          </p>
        ) : (
          sortedSections.map(([sectionName, items]) => (
            <div key={sectionName} className="mb-8">
              <h2 className="text-lg font-bold text-[#006C35] mb-4 flex items-center gap-2">
                <span>🇸🇦</span>
                <span>{sectionName}</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {items.map((p, idx) => (
                  <div
                    key={p._id || idx}
                    className={`rounded-xl p-3 border-2 ${
                      idx % 2 === 0
                        ? 'bg-[#006C35] text-white border-[#006C35]'
                        : 'bg-white text-[#006C35] border-[#006C35]'
                    }`}
                  >
                    <div className="aspect-square overflow-hidden rounded-lg mb-2" style={{ backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.15)' : '#f0fdf4' }}>
                      {p.image ? (
                        <img src={p.image} alt={getName(p)} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm opacity-60">
                          {isRtl ? 'بدون صورة' : 'No image'}
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-sm truncate">{getName(p)}</h3>
                    <p className={`text-xl font-bold mt-1 ${idx % 2 === 0 ? 'text-white' : 'text-[#006C35]'}`}>
                      {Number(p.price).toFixed(2)} <span className="text-sm">SAR</span>
                    </p>
                    {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                      <p className={`text-xs line-through mt-1 ${idx % 2 === 0 ? 'text-white/60' : 'text-gray-400'}`}>
                        {Number(p.originalPrice).toFixed(2)} SAR
                      </p>
                    )}
                    {p.offerEndDate && (
                      <p className={`text-xs mt-1 ${idx % 2 === 0 ? 'text-white/70' : 'text-gray-500'}`}>
                        {isRtl ? `ينتهي: ${formatDate(p.offerEndDate)}` : `Ends: ${formatDate(p.offerEndDate)}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center py-4 border-t border-green-100">
        <span className="text-2xl">🇸🇦</span>
      </div>
    </div>
  );
}
