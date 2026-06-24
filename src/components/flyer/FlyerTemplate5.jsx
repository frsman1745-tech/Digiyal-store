export default function FlyerTemplate5({ store, products, language }) {
  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  const formatDate = (d) => d ? new Date(d).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

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
    <div dir={dir} className="font-sans">
      <div className="bg-[#003DA5] text-white px-6 py-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          {isRtl ? store.name : (store.nameEn || store.name)}
        </h1>
        <p className="text-center text-sm text-blue-200 mt-1">
          {isRtl
            ? `عروض من ${formatDate(store.currentFlyerStart)} إلى ${formatDate(store.currentFlyerEnd)}`
            : `Offers from ${formatDate(store.currentFlyerStart)} to ${formatDate(store.currentFlyerEnd)}`
          }
        </p>
      </div>

      <div className="p-4 bg-white">
        {!products || products.length === 0 ? (
          <p className="text-center text-gray-400 py-12">
            {isRtl ? 'لا توجد منتجات' : 'No products available'}
          </p>
        ) : (
          sortedSections.map(([sectionName, items]) => (
            <div key={sectionName} className="mb-6">
              <div className="bg-[#003DA5] text-white px-4 py-2 font-bold text-sm mb-3">
                {sectionName}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((p, idx) => (
                  <div key={p._id || idx} className="bg-white rounded-lg border border-gray-200 p-3 relative">
                    <div className="relative aspect-square bg-gray-50 rounded mb-2 overflow-hidden">
                      {p.image ? (
                        <img src={p.image} alt={getName(p)} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                          {isRtl ? 'بدون صورة' : 'No image'}
                        </div>
                      )}
                      <span className="absolute top-1 right-1 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {isRtl ? 'عرض' : 'OFFER'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 truncate">{getName(p)}</h3>
                    <div className="mt-2">
                      <span className="inline-block bg-yellow-400 text-black font-bold px-3 py-1 rounded-lg text-sm">
                        {Number(p.price).toFixed(2)} SAR
                      </span>
                      {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                        <p className="text-xs text-gray-400 line-through mt-1">
                          {Number(p.originalPrice).toFixed(2)} SAR
                        </p>
                      )}
                    </div>
                    {p.offerEndDate && (
                      <p className="text-[10px] text-gray-400 mt-1">
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

      <div className="flex justify-center py-4 border-t border-gray-200">
        <svg width="200" height="30" viewBox="0 0 200 30" className="text-gray-300">
          <rect x="0" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="25" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="50" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="75" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="100" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="125" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="150" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="175" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" />
          <text x="100" y="26" textAnchor="middle" fontSize="8" fill="currentColor">01234567</text>
        </svg>
      </div>
    </div>
  );
}
