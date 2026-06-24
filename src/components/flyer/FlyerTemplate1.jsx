export default function FlyerTemplate1({ store, products, language }) {
  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

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
    <div
      dir={dir}
      className="bg-[#f5f5f0] text-[#1a1a1a]"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif", border: '4px solid #1a1a1a' }}
    >
      <div className="p-6">
        <header className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide uppercase">
            {isRtl ? store.name : (store.nameEn || store.name)}
          </h1>
          <hr className="border-t-2 border-[#1a1a1a] my-2" />
          <p className="text-sm text-gray-600 mt-1">
            {isRtl
              ? `العروض من ${formatDate(store.currentFlyerStart)} حتى ${formatDate(store.currentFlyerEnd)}`
              : `Offers from ${formatDate(store.currentFlyerStart)} to ${formatDate(store.currentFlyerEnd)}`
            }
          </p>
        </header>

        {!products || products.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            {isRtl ? 'لا توجد منتجات' : 'No products available'}
          </p>
        ) : (
          <div className="space-y-6">
            {sortedSections.map(([sectionName, items]) => (
              <div key={sectionName}>
                <h2 className="text-xl font-bold uppercase tracking-wide mb-3">
                  {sectionName}
                </h2>
                <hr className="border-t border-gray-400 mb-3" />
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((p, idx) => (
                    <div key={p._id || idx} className="flex items-start gap-3">
                      <div className="w-20 h-20 shrink-0 overflow-hidden bg-gray-200">
                        {p.image ? (
                          <img src={p.image} alt={getName(p)} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            {isRtl ? 'لا توجد صورة' : 'No image'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-tight truncate">
                          {getName(p)}
                        </h3>
                        <p className="text-lg font-bold text-[#c62828] mt-1">
                          {Number(p.price).toFixed(2)} SAR
                        </p>
                        {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                          <p className="text-xs text-gray-500 line-through">
                            {Number(p.originalPrice).toFixed(2)} SAR
                          </p>
                        )}
                        {p.offerEndDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {isRtl ? `ينتهي: ${formatDate(p.offerEndDate)}` : `Ends: ${formatDate(p.offerEndDate)}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
