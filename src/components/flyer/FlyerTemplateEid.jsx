export default function FlyerTemplateEid({ store, products, language }) {
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
      <div className="bg-gradient-to-br from-[#009688] to-[#00796B] text-white px-6 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="absolute text-3xl" style={{ top: `${10 + i * 18}%`, left: `${5 + i * 16}%` }}>✨</span>
          ))}
        </div>
        <div className="flex justify-center gap-2 text-2xl mb-2 relative">
          <span>✨</span>
          <span>⭐</span>
          <span>✨</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold relative">
          {isRtl ? 'عيد مبارك' : 'Eid Mubarak'}
        </h1>
        <div className="w-20 h-1 bg-[#FFD700] mx-auto my-2 rounded-full relative" />
        <h2 className="text-lg font-semibold relative">
          {isRtl ? store.name : (store.nameEn || store.name)}
        </h2>
        <p className="text-sm text-teal-100 mt-1 relative">
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
              <div className="flex items-center gap-2 mb-4">
                <span>✨</span>
                <h2 className="text-lg font-bold text-[#009688]">{sectionName}</h2>
                <span>✨</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((p, idx) => (
                  <div key={p._id || idx} className="bg-gradient-to-br from-white to-teal-50 rounded-xl border border-teal-100 p-3 shadow-sm relative overflow-hidden">
                    <span className="absolute top-1 right-2 text-xs opacity-20">✨</span>
                    <div className="aspect-square overflow-hidden rounded-lg bg-teal-50 mb-2">
                      {p.image ? (
                        <img src={p.image} alt={getName(p)} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-teal-200 text-sm">
                          {isRtl ? 'بدون صورة' : 'No image'}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{getName(p)}</h3>
                    <p className="text-xl font-bold text-[#009688] mt-1">
                      {Number(p.price).toFixed(2)} <span className="text-sm">SAR</span>
                    </p>
                    {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                      <p className="text-xs text-gray-400 line-through">
                        {Number(p.originalPrice).toFixed(2)} SAR
                      </p>
                    )}
                    {p.offerEndDate && (
                      <p className="text-xs text-gray-400 mt-1">
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

      <div className="text-center py-4 border-t border-teal-100">
        <span className="text-lg">✨ ⭐ ✨</span>
      </div>
    </div>
  );
}
