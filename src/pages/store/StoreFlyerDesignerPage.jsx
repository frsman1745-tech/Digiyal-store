import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import FlyerTemplate1 from '../../components/flyer/FlyerTemplate1';
import FlyerTemplate2 from '../../components/flyer/FlyerTemplate2';
import FlyerTemplate3 from '../../components/flyer/FlyerTemplate3';
import FlyerTemplate4 from '../../components/flyer/FlyerTemplate4';
import FlyerTemplate5 from '../../components/flyer/FlyerTemplate5';
import BackButton from '../../components/ui/BackButton';
import FlyerTemplateComingSoon from '../../components/flyer/FlyerTemplateComingSoon';
import { Save, Eye, Download, Calendar, Check, X, ImageIcon } from 'lucide-react';

const TEMPLATES = [
  { id: 1, nameAr: 'كلاسيك', nameEn: 'Classic Newspaper', component: FlyerTemplate1, color: 'from-stone-100 to-stone-200', desc: 'تصميم كلاسيكي يشبه الجرائد الورقية' },
  { id: 2, nameAr: 'حديث', nameEn: 'Modern Cards', component: FlyerTemplate2, color: 'from-pink-100 to-blue-100', desc: 'بطاقات عصرية بألوان زاهية' },
  { id: 3, nameAr: 'بسيط', nameEn: 'Minimalist Clean', component: FlyerTemplate3, color: 'from-white to-gray-100', desc: 'تصميم نظيف وبسيط' },
  { id: 4, nameAr: 'تقليدي', nameEn: 'Arabic Traditional', component: FlyerTemplate4, color: 'from-amber-50 to-amber-100', desc: 'طابع عربي تقليدي أصيل' },
  { id: 5, nameAr: 'كتالوج', nameEn: 'Supermarket Catalog', component: FlyerTemplate5, color: 'from-blue-50 to-blue-100', desc: 'كتالوج سوبرماركت منظم' },
  { id: 6, nameAr: 'قريباً', nameEn: 'Coming Soon', component: FlyerTemplateComingSoon, color: 'from-gray-100 to-gray-200', desc: 'قالب جديد قادم قريباً', locked: true },
];

export default function StoreFlyerDesignerPage() {
  const { direction, language } = useLanguage();
  const { t } = useTranslation();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [storeRes, productsRes] = await Promise.all([
          api.get('/store/profile'),
          api.get('/store/products'),
        ]);
        const s = storeRes.data.store || storeRes.data;
        setStore(s);
        setSelectedTemplate(s.selectedTemplate || 1);
        setStartDate(s.currentFlyerStart ? s.currentFlyerStart.split('T')[0] : '');
        setEndDate(s.currentFlyerEnd ? s.currentFlyerEnd.split('T')[0] : '');
        const prods = productsRes.data.products || productsRes.data || [];
        setProducts(prods);
        setSelectedProductIds(prods.map((p) => p._id || p.id));
      } catch {
        setError(t('common.error'));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const toggleProduct = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedProductIds(products.map((p) => p._id || p.id));
  };

  const deselectAll = () => {
    setSelectedProductIds([]);
  };

  const filteredProducts = products.filter((p) => selectedProductIds.includes(p._id || p.id));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put('/store/flyer', {
        selectedTemplate,
        currentFlyerStart: startDate || undefined,
        currentFlyerEnd: endDate || undefined,
        productIds: selectedProductIds,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(t('common.error'));
    }
    setSaving(false);
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const el = document.getElementById('flyer-preview-content');
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${store?.name || 'flyer'}-flyer-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch {
      setError(t('common.error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const PreviewComponent = TEMPLATES.find((t) => t.id === selectedTemplate && !t.locked)?.component;

  if (showPreview && PreviewComponent && store) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900" dir={direction}>
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 px-4 py-3 flex items-center justify-between no-print">
          <button onClick={() => setShowPreview(false)}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            {language === 'ar' ? '→ رجوع' : '← Back'}
          </button>
          <h2 className="font-semibold text-sm">
            {language === 'ar' ? 'معاينة الجريدة' : 'Flyer Preview'}
          </h2>
          <button onClick={handleDownloadPDF}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark">
            <Download size={16} /> PDF
          </button>
        </div>
        <div id="flyer-preview-content" className="flyer-page">
          <PreviewComponent store={store} products={filteredProducts} language={language} />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>{t('store.flyer.title')} - {t('app.name')}</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={direction}>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center gap-3">
            <BackButton fallback="/store/dashboard" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              <Calendar size={22} className="text-primary" /> {t('store.flyer.title')}
            </h1>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm text-center flex items-center justify-center gap-2">
              <Check size={16} /> {language === 'ar' ? '✓ تم حفظ التغييرات' : '✓ Changes saved'}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center flex items-center justify-center gap-2">
              <X size={16} /> {error}
            </div>
          )}

          <div className="bg-white dark:bg-dark-light rounded-2xl p-6 shadow-sm space-y-6 border border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {language === 'ar' ? 'فترة العروض' : 'Offer Period'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    {language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
                  </label>
                  <input type="date" value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    {language === 'ar' ? 'تاريخ النهاية' : 'End Date'}
                  </label>
                  <input type="date" value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-light rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {t('store.flyer.template')}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {TEMPLATES.map((tpl) => (
                <button key={tpl.id}
                  onClick={() => !tpl.locked && setSelectedTemplate(tpl.id)}
                  disabled={tpl.locked}
                  className={`aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center gap-2 text-xs font-medium transition-all bg-gradient-to-b ${tpl.color} ${
                    selectedTemplate === tpl.id && !tpl.locked
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-gray-200 dark:border-gray-600'
                  } ${tpl.locked ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 cursor-pointer'}`}
                >
                  <ImageIcon size={20} className={tpl.locked ? 'text-gray-400' : 'text-gray-600'} />
                  <span className="text-center px-1 text-gray-700">
                    {language === 'ar' ? tpl.nameAr : tpl.nameEn}
                  </span>
                  {tpl.locked && <span className="text-[10px] text-gray-400">قريباً</span>}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {language === 'ar' ? `تم اختيار: ${TEMPLATES.find(t => t.id === selectedTemplate)?.nameAr}` : `Selected: ${TEMPLATES.find(t => t.id === selectedTemplate)?.nameEn}`}
            </p>
          </div>

          <div className="bg-white dark:bg-dark-light rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {language === 'ar' ? 'المنتجات في الجريدة' : 'Products in Flyer'}
              </h2>
              {products.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={selectAll}
                    className="text-xs text-primary hover:underline">
                    {language === 'ar' ? 'تحديد الكل' : 'Select All'}
                  </button>
                  <button onClick={deselectAll}
                    className="text-xs text-gray-400 hover:underline">
                    {language === 'ar' ? 'إلغاء الكل' : 'Deselect All'}
                  </button>
                </div>
              )}
            </div>
            {products.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {language === 'ar' ? 'لا توجد منتجات مضافة بعد. أضف منتجات أولاً.' : 'No products yet. Add products first.'}
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  {language === 'ar'
                    ? `تم اختيار ${selectedProductIds.length} من ${products.length} منتج`
                    : `${selectedProductIds.length} of ${products.length} products selected`}
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {products.map((p) => {
                    const pid = p._id || p.id;
                    const selected = selectedProductIds.includes(pid);
                    return (
                      <label key={pid}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                          selected ? 'bg-primary/5 border border-primary/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent'
                        }`}>
                        <input type="checkbox" checked={selected}
                          onChange={() => toggleProduct(pid)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30" />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                          {language === 'ar' ? p.name : (p.nameEn || p.name)}
                        </span>
                        {p.price && (
                          <span className="text-xs text-gray-500">{p.price} {t('common.currency') || 'ر.س'}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {PreviewComponent && store && filteredProducts.length > 0 && (
              <button onClick={() => setShowPreview(true)}
                className="flex items-center justify-center gap-2 flex-1 py-3 border-2 border-primary text-primary font-medium rounded-xl hover:bg-primary/5 transition-colors">
                <Eye size={18} />{language === 'ar' ? 'معاينة الجريدة' : 'Preview Flyer'}
              </button>
            )}
            <button onClick={handleSave} disabled={saving}
              className="flex items-center justify-center gap-2 flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Save size={18} />}
              {saving
                ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                : t('store.flyer.save')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
