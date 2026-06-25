import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { compressImage, fileToDataUrl } from '../../utils/imageCompressor';
import api from '../../utils/api';
import { Upload, X, Image, Save, AlertCircle, ChevronDown, ChevronUp, Package, Percent, Layers } from 'lucide-react';
import BackButton from '../../components/ui/BackButton';

const BADGE_OPTIONS = [
  { type: 'new', labelAr: 'جديد', labelEn: 'New', color: 'bg-green-500' },
  { type: 'hot_deal', labelAr: 'عرض ناري', labelEn: 'Hot Deal', color: 'bg-red-500' },
  { type: 'low_stock', labelAr: 'آخر القطع', labelEn: 'Low Stock', color: 'bg-orange-500' },
  { type: 'best_seller', labelAr: 'الأكثر مبيعاً', labelEn: 'Best Seller', color: 'bg-blue-500' },
  { type: 'bundle', labelAr: 'حزمة', labelEn: 'Bundle', color: 'bg-purple-500' },
];

const CATEGORIES = [
  { value: '', labelAr: 'اختر تصنيف', labelEn: 'Select category' },
  { value: 'dairy', labelAr: 'ألبان ومشتقات', labelEn: 'Dairy' },
  { value: 'vegetables', labelAr: 'خضروات وفواكه', labelEn: 'Vegetables & Fruits' },
  { value: 'meat', labelAr: 'لحوم ودواجن', labelEn: 'Meat & Poultry' },
  { value: 'beverages', labelAr: 'مشروبات', labelEn: 'Beverages' },
  { value: 'bakery', labelAr: 'مخبوزات', labelEn: 'Bakery' },
  { value: 'cleaning', labelAr: 'منظفات', labelEn: 'Cleaning' },
  { value: 'sweets', labelAr: 'حلويات', labelEn: 'Sweets' },
  { value: 'other', labelAr: 'أخرى', labelEn: 'Other' },
];

export default function AddProductPage() {
  const { direction, language } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '', description: '', price: '', originalPrice: '',
    offerStartDate: '', offerEndDate: '', category: '',
    section: '', isFeaturedOnFlyer: true,
    badges: [], bundleType: '', buyQuantity: 1, getQuantity: 1,
    bundlePrice: '', discountPercent: '', bundleDescription: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showBundle, setShowBundle] = useState(false);

  const handleImageSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalSize((file.size / 1024).toFixed(1));
    try {
      const compressed = await compressImage(file);
      setCompressedSize((compressed.file.size / 1024).toFixed(1));
      setImageFile(compressed);
      setImagePreview(compressed.dataUrl);
    } catch {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setCompressedSize(null);
    }
  }, []);

  const uploadImage = async () => {
    if (!imageFile) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const dataUrl = imageFile.dataUrl || await fileToDataUrl(imageFile);
      const res = await api.post('/store/upload', { image: dataUrl });
      setImageUrl(res.data.url || res.data.imageUrl);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'فشل رفع الصورة');
    }
    setUploading(false);
  };

  const toggleBadge = (type) => {
    setForm((prev) => {
      const has = prev.badges.includes(type);
      if (has) return { ...prev, badges: prev.badges.filter((b) => b !== type) };
      if (prev.badges.length >= 2) return prev;
      return { ...prev, badges: [...prev.badges, type] };
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !imageUrl) {
      setError('يرجى تعبئة الحقول المطلوبة: الاسم، السعر، الصورة');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        offerStartDate: form.offerStartDate || undefined,
        offerEndDate: form.offerEndDate || undefined,
        image: imageUrl,
        bundleDeal: form.bundleType ? {
          bundleType: form.bundleType,
          buyQuantity: parseInt(form.buyQuantity) || 1,
          getQuantity: parseInt(form.getQuantity) || 1,
          bundlePrice: form.bundlePrice ? parseFloat(form.bundlePrice) : null,
          discountPercent: form.discountPercent ? parseFloat(form.discountPercent) : null,
          bundleDescription: form.bundleDescription,
        } : undefined,
      };
      await api.post('/store/products', payload);
      navigate('/store/products');
    } catch (err) {
      const data = err.response?.data;
      if (data?.error === 'LIMIT_REACHED') {
        setError(`وصلت لحد الخطة (${data.limit} منتج). تواصل معنا للترقية.`);
      } else {
        setError(data?.message || 'حدث خطأ أثناء الحفظ');
      }
    }
    setSaving(false);
  };

  return (
    <>
      <Helmet><title>إضافة منتج - لوحة التحكم</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={direction}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center gap-3">
            <BackButton fallback="/store/products" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
              {language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
            </h1>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={18} /><span>{error}</span>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-6 shadow-sm">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleImageSelect({ target: { files: e.dataTransfer.files } }); }}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
            >
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              {imagePreview ? (
                <div className="space-y-3">
                  <img src={imagePreview} alt="Preview" className="w-40 h-40 object-cover rounded-xl mx-auto" />
                  {originalSize && <p className="text-xs text-gray-500">الحجم الأصلي: {originalSize} KB</p>}
                  {compressedSize && <p className="text-xs text-green-600">بعد الضغط: {compressedSize} KB ✓</p>}
                  {!imageUrl && (
                    <button onClick={(e) => { e.stopPropagation(); uploadImage(); }}
                      disabled={uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                    >
                      {uploading ? `جاري الرفع ${uploadProgress}%` : 'رفع الصورة'}
                    </button>
                  )}
                  {imageUrl && <p className="text-xs text-green-600">✓ تم رفع الصورة</p>}
                  <button onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); setImageUrl(''); }}
                    className="text-red-500 text-xs"><X size={14} className="inline" /> إزالة</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={32} className="mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500">اسحب الصورة هنا أو اضغط للاختيار</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المنتج *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: حليب المراعي كامل الدسم 1 لتر" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="وصف المنتج (اختياري)" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر الحالي *</label>
                  <div className="relative">
                    <input type="number" step="0.01" value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" />
                    <span className="absolute inset-y-0 end-0 flex items-center pe-3 text-sm text-gray-500">ريال</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">السعر الأصلي</label>
                  <div className="relative">
                    <input type="number" step="0.01" value={form.originalPrice}
                      onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" />
                    <span className="absolute inset-y-0 end-0 flex items-center pe-3 text-sm text-gray-500">ريال</span>
                  </div>
                  {form.originalPrice && (
                    <p className="text-xs text-gray-500 mt-1">سيظهر السعر الأصلي مشطوباً</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">بداية العرض</label>
                  <input type="date" value={form.offerStartDate}
                    onChange={(e) => setForm({ ...form, offerStartDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نهاية العرض</label>
                  <input type="date" value={form.offerEndDate}
                    onChange={(e) => setForm({ ...form, offerEndDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التصنيف</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500">
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {language === 'ar' ? c.labelAr : c.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">القسم (لترتيب الجريدة)</label>
                  <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    placeholder={language === 'ar' ? 'مثال: ألبان' : 'e.g. Dairy'} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">عرض في الجريدة</label>
                <button onClick={() => setForm({ ...form, isFeaturedOnFlyer: !form.isFeaturedOnFlyer })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isFeaturedOnFlyer ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isFeaturedOnFlyer ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الشارات (حد أقصى 2)</label>
                <div className="flex flex-wrap gap-2">
                  {BADGE_OPTIONS.map((b) => (
                    <button key={b.type} onClick={() => toggleBadge(b.type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        form.badges.includes(b.type) ? `${b.color} text-white ring-2 ring-offset-1 ring-${b.color.split('-')[1]}-400` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {language === 'ar' ? b.labelAr : b.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button onClick={() => setShowBundle(!showBundle)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-full">
                  <Package size={16} />صفقة/حزمة
                  {showBundle ? <ChevronUp size={16} className="mr-auto" /> : <ChevronDown size={16} className="mr-auto" />}
                </button>
                {showBundle && (
                  <div className="mt-4 space-y-4">
                    <select value={form.bundleType} onChange={(e) => setForm({ ...form, bundleType: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                      <option value="">لا يوجد</option>
                      <option value="buy_x_get_y">اشتر X واحصل على Y</option>
                      <option value="fixed_bundle_price">سعر ثابت للحزمة</option>
                      <option value="percentage_off_second">خصم على الثاني</option>
                    </select>
                    {form.bundleType === 'buy_x_get_y' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs mb-1">عدد القطع للشراء</label>
                          <input type="number" value={form.buyQuantity}
                            onChange={(e) => setForm({ ...form, buyQuantity: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300" /></div>
                        <div><label className="block text-xs mb-1">عدد القطع المجانية</label>
                          <input type="number" value={form.getQuantity}
                            onChange={(e) => setForm({ ...form, getQuantity: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300" /></div>
                      </div>
                    )}
                    {form.bundleType === 'fixed_bundle_price' && (
                      <div><label className="block text-xs mb-1">سعر الحزمة</label>
                        <input type="number" step="0.01" value={form.bundlePrice}
                          onChange={(e) => setForm({ ...form, bundlePrice: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300" /></div>
                    )}
                    {form.bundleType === 'percentage_off_second' && (
                      <div><label className="block text-xs mb-1">نسبة الخصم (%)</label>
                        <input type="number" min="0" max="100" value={form.discountPercent}
                          onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300" /></div>
                    )}
                    {form.bundleType && (
                      <div><label className="block text-xs mb-1">وصف الصفقة</label>
                        <input value={form.bundleDescription}
                          onChange={(e) => setForm({ ...form, bundleDescription: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300"
                          placeholder={language === 'ar' ? 'اشتر 2 واحصل على الثالث مجاناً' : 'Buy 2 get 1 free'} /></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving || !form.name || !form.price || (!imageUrl && !imageFile)}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Save size={18} />}
            {saving ? 'جاري الحفظ...' : 'حفظ المنتج'}
          </button>
        </div>
      </div>
    </>
  );
}
