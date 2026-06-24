export default function FlyerTemplate4({ store, products, language }) {
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
    <div dir={dir} className="bg-[#FFF8E7] font-sans" style={{ fontFamily: "'Traditional Arabic', 'Scheherazade New', serif" }}>
      <div className="relative">
        <div className="h-2 bg-gradient-to-r from-[#C9A84C] via-[#1B5E20] to-[#0D2B5E]" />
        <div className="border-t-2 border-b-2 border-[#C9A84C] mx-4 my-0" />
      </div>

      <div className="px-6 py-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-wider text-[#0D2B5E]">
          {store.name}
        </h1>
        <div className="flex items-center justify-center gap-3 my-3">
          <span className="h-px w-12 bg-[#C9A84C]" />
          <span className="text-[#C9A84C] text-lg">✦</span>
          <span className="h-px w-12 bg-[#C9A84C]" />
        </div>
        <p className="text-[#1B5E20] text-sm">
          {`عروض من ${formatDate(store.currentFlyerStart)} إلى ${formatDate(store.currentFlyerEnd)}`}
        </p>
      </div>

      <div className="px-6 pb-8">
        {!products || products.length === 0 ? (
          <p className="text-center text-[#C9A84C] py-12">
            {isRtl ? 'لا توجد منتجات' : 'No products available'}
          </p>
        ) : (
          <div className="space-y-8">
            {sortedSections.map(([sectionName, items]) => (
              <div key={sectionName}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-px flex-1 bg-[#C9A84C]" />
                  <h2 className="text-xl font-bold text-[#0D2B5E] tracking-wider">{sectionName}</h2>
                  <span className="h-px flex-1 bg-[#C9A84C]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {items.map((p, idx) => (
                    <div
                      key={p._id || idx}
                      className={`border-2 border-[#C9A84C] rounded-sm p-3 ${idx % 2 === 0 ? '' : 'border-l'}`}
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-[#FFF8E7] mb-3">
                        {p.image ? (
                          <img src={p.image} alt={getName(p)} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#C9A84C] text-sm">
                            {isRtl ? 'بدون صورة' : 'No image'}
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-[#0D2B5E] text-sm leading-tight truncate">
                        {getName(p)}
                      </h3>
                      <span className="inline-block bg-[#C9A84C] text-white px-3 py-1 rounded mt-2 text-sm font-bold">
                        {Number(p.price).toFixed(2)} SAR
                      </span>
                      {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                        <p className="text-xs text-gray-500 line-through mt-1">
                          {Number(p.originalPrice).toFixed(2)} SAR
                        </p>
                      )}
                      {p.offerEndDate && (
                        <p className="text-xs text-[#C9A84C] mt-1">
                          {`ينتهي: ${formatDate(p.offerEndDate)}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t-2 border-b-2 border-[#C9A84C] mx-4" />
      <div className="h-2 bg-gradient-to-r from-[#0D2B5E] via-[#1B5E20] to-[#C9A84C]" />
    </div>
  );
}
