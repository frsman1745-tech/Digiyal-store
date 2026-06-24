const CARD_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

function isLight(bgHex) {
  const c = bgHex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
}

export default function FlyerTemplate2({ store, products, language }) {
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
      <div className="bg-gradient-to-r from-[#2c3e50] to-[#3498db] text-white p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          {isRtl ? store.name : (store.nameEn || store.name)}
        </h1>
        <div className="h-1 w-24 bg-[#f1c40f] mx-auto mt-2 rounded-full" />
        <p className="text-center text-sm text-blue-100 mt-2">
          {isRtl
            ? `عروض من ${formatDate(store.currentFlyerStart)} إلى ${formatDate(store.currentFlyerEnd)}`
            : `Offers from ${formatDate(store.currentFlyerStart)} to ${formatDate(store.currentFlyerEnd)}`
          }
        </p>
      </div>

      <div className="p-4">
        {!products || products.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            {isRtl ? 'لا توجد منتجات' : 'No products available'}
          </p>
        ) : (
          <div className="space-y-6">
            {sortedSections.map(([sectionName, items]) => (
              <div key={sectionName}>
                <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">
                  {sectionName}
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((p, idx) => {
                    const bgColor = CARD_COLORS[idx % CARD_COLORS.length];
                    const light = isLight(bgColor);
                    return (
                      <div
                        key={p._id || idx}
                        className="rounded-xl shadow-md p-3 flex flex-col"
                        style={{ backgroundColor: bgColor }}
                      >
                        <div className="rounded-lg overflow-hidden bg-white/30 mb-3 aspect-square">
                          {p.image ? (
                            <img src={p.image} alt={getName(p)} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: light ? '#333' : '#fff' }}>
                              {isRtl ? 'بدون صورة' : 'No image'}
                            </div>
                          )}
                        </div>
                        <h3 className={`font-semibold text-sm leading-tight mb-1 ${light ? 'text-gray-900' : 'text-white'}`}>
                          {getName(p)}
                        </h3>
                        <p className={`text-4xl font-bold mt-auto ${light ? 'text-gray-900' : 'text-white'}`}>
                          {Number(p.price).toFixed(2)}
                          <span className="text-base font-normal ml-1">SAR</span>
                        </p>
                        {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                          <p className={`text-xs line-through ${light ? 'text-gray-600' : 'text-white/70'}`}>
                            {Number(p.originalPrice).toFixed(2)} SAR
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
