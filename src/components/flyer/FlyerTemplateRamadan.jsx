export default function FlyerTemplateRamadan({ store, products, language }) {
  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

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
    <div dir={dir} className="bg-[#FFF3E0] font-sans">
      <div className="border-t-4 border-b-4 border-[#D4A843] relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#D4A843] via-[#1B5E20] to-[#D4A843]" />

        <div className="px-6 py-6 text-center relative">
          <div className="flex justify-center gap-2 text-2xl mb-2">
            <span>🌙</span>
            <span>✨</span>
            <span>🌙</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1B5E20]" style={{ fontFamily: "'Traditional Arabic', 'Scheherazade New', serif" }}>
            رمضان كريم
          </h1>
          <div className="flex items-center justify-center gap-3 my-2">
            <span className="h-px w-16 bg-[#D4A843]" />
            <span className="text-[#D4A843] text-lg">⋆</span>
            <span className="h-px w-16 bg-[#D4A843]" />
          </div>
          <h2 className="text-xl text-[#D4A843] font-bold">
            {store.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
            <span>🌙</span>
            <span>{`عروض من ${formatDate(store.currentFlyerStart)} إلى ${formatDate(store.currentFlyerEnd)}`}</span>
          </p>
        </div>
      </div>

      <div className="p-6">
        {!products || products.length === 0 ? (
          <p className="text-center text-[#D4A843] py-12">
            {isRtl ? 'لا توجد منتجات' : 'No products available'}
          </p>
        ) : (
          sortedSections.map(([sectionName, items]) => (
            <div key={sectionName} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span>🌙</span>
                <h2 className="text-lg font-bold text-[#1B5E20]">{sectionName}</h2>
                <span>🌙</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {items.map((p, idx) => (
                  <div key={p._id || idx} className="bg-white rounded-lg border border-[#D4A843] p-3 shadow-sm">
                    <div className="aspect-[4/3] overflow-hidden rounded bg-[#FFF3E0] mb-2">
                      {p.image ? (
                        <img src={p.image} alt={getName(p)} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#D4A843] text-sm">
                          {isRtl ? 'بدون صورة' : 'No image'}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{getName(p)}</h3>
                    <p className="text-lg font-bold text-[#1B5E20] mt-1">
                      {Number(p.price).toFixed(2)} SAR
                    </p>
                    {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                      <p className="text-xs text-gray-400 line-through">
                        {Number(p.originalPrice).toFixed(2)} SAR
                      </p>
                    )}
                    {p.offerEndDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {`ينتهي: ${formatDate(p.offerEndDate)}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center py-4 border-t border-[#D4A843]/30">
        <span className="text-2xl">🌙 ✨ 🌙</span>
      </div>
    </div>
  );
}
