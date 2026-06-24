export default function FlyerTemplate3({ store, products, language }) {
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
      <header className="text-center py-8 px-6 border-b border-gray-200">
        {store.logo && (
          <img src={store.logo} alt="logo" className="w-16 h-16 object-contain mx-auto mb-3" loading="lazy" />
        )}
        <h1 className="text-2xl font-bold text-gray-900">
          {isRtl ? store.name : (store.nameEn || store.name)}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {isRtl
            ? `عروض من ${formatDate(store.currentFlyerStart)} إلى ${formatDate(store.currentFlyerEnd)}`
            : `Offers from ${formatDate(store.currentFlyerStart)} to ${formatDate(store.currentFlyerEnd)}`
          }
        </p>
      </header>

      <div className="p-6">
        {!products || products.length === 0 ? (
          <p className="text-center text-gray-400 py-12">
            {isRtl ? 'لا توجد منتجات' : 'No products available'}
          </p>
        ) : (
          sortedSections.map(([sectionName, items]) => (
            <div key={sectionName} className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{sectionName}</h2>
              <div className="grid grid-cols-2 gap-6">
                {items.map((p, idx) => (
                  <div key={p._id || idx} className="border-b border-gray-200 pb-4">
                    <div className="aspect-square overflow-hidden bg-gray-50 mb-3">
                      {p.image ? (
                        <img src={p.image} alt={getName(p)} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                          {isRtl ? 'بدون صورة' : 'No image'}
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm text-gray-700 leading-tight truncate">{getName(p)}</h3>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {Number(p.price).toFixed(2)} SAR
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
    </div>
  );
}
