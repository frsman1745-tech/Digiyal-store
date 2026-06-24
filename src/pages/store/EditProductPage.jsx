import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { compressImage } from '../../utils/imageCompressor';
import api from '../../utils/api';
import { Upload, X, Save, AlertCircle, ChevronDown, ChevronUp, Package } from 'lucide-react';
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

export default function EditProductPage() {
  const { id } = useParams();
  const { direction, language } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', originalPrice: '',
    offerStartDate: '', offerEndDate: '', category: '',
    section: '', isFeaturedOnFlyer: true,
    badges: [], bundleType: '', buyQuantity: 1, getQuantity: 1,
    bundlePrice: '', discountPercent: '', bundleDescription: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [compressedSize, setCompressedSize] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showBundle, setShowBundle] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/store/products/${id}`);
        const p = res.data.product || res.data;
        setForm({
          name: p.name || '',
          description: p.description || '',
          price: p.price?.toString() || '',
          originalPrice: p.originalPrice?.toString() || '',
          offerStartDate: p.offerStartDate ? p.offerStartDate.split('T')[0] : '',
          offerEndDate: p.offerEndDate ? p.offerEndDate.split('T')[0] : '',
          category: p.category || '',
          section: p.section?.sectionName || '',
          isFeaturedOnFlyer: p.isFeaturedOnFlyer ?? true,
          badges: p.badges?.map((b) => (typeof b === 'string' ? b : b.type)) || [],
          bundleType: p.bundleDeal?.bundleType || '',
          buyQuantity: p.bundleDeal?.buyQuantity || 1,
          getQuantity: p.bundleDeal?.getQuantity || 1,
          bundlePrice: p.bundleDeal?.bundlePrice?.toString() || '',
          discountPercent: p.bundleDeal?.discountPercent?.toString() || '',
          bundleDescription: p.bundleDeal?.bundleDescription || '',
        });
        if (p.image) setExistingImage(p.image);
        if (p.bundleDeal?.bundleType) setShowBundle(true);
      } catch { setNotFound(true); }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleImageSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setCompressedSize((compressed.size / 1024).toFixed(1));
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const uploadImage = async () => {
    if (!imageFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const res = await api.post('/store/upload', fd);
      setImageUrl(res.data.url || res.data.imageUrl);
    } catch { setError('فشل رفع الصورة'); }
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
    if (!form.name || !form.price) {
      setError('يرجى تعبئة الاسم والسعر');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        image: imageUrl || existingImage,
        bundleDeal: form.bundleType ? {
          bundleType: form.bundleType,
          buyQuantity: parseInt(form.buyQuantity) || 1,
          getQuantity: parseInt(form.getQuantity) || 1,
          bundlePrice: form.bundlePrice ? parseFloat(form.bundlePrice) : null,
          discountPercent: form.discountPercent ? parseFloat(form.discountPercent) : null,
          bundleDescription: form.bundleDescription,
        } : undefined,
      };
      await api.put(`/store/products/${id}`, payload);
      navigate('/store/products');
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" dir={direction}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4" dir={direction}>
        <p className="text-gray-500 text-lg mb-4">المنتج غير موجود</p>
        <button onClick={() => navigate('/store/products')}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm">العودة للمنتجات</button>
      </div>
    );
  }

  const currentImage = imagePreview || existingImage;

  return (
    <>
      <Helmet><title>تعديل: {form.name} - لوحة التحكم</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={direction}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center gap-3">
            <BackButton fallback="/store/products" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">
              {language === 'ar' ? `تعديل: ${form.name}` : `Edit: ${form.name}`}
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
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400"
            >
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              {currentImage ? (
                <div className="space-y-2">
                  <img src={currentImage} alt="Product" className="w-32 h-32 object-cover rounded-xl mx-auto" />
                  <p className="text-xs text-gray-500">اضغط لاستبدال الصورة</p>
                  {compressedSize && <p className="text-xs text-green-600">بعد الضغط: {compressedSize} KB</p>}
                  {imageFile && !imageUrl && (
                    <button onClick={(e) => { e.stopPropagation(); uploadImage(); }} disabled={uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs">{uploading ? 'جاري الرفع...' : 'رفع الصورة'}</button>
                  )}
                  {imageFile && <p className="text-xs text-green-600">✓ تم رفع الصورة</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={28} className="mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500">اضغط لاختيار صورة</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">اسم المنتج *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">السعر الحالي *</label>
                  <input type="number" step="0.01" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السعر الأصلي</label>
                  <input type="number" step="0.01" value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">بداية العرض</label>
                  <input type="date" value={form.offerStartDate}
                    onChange={(e) => setForm({ ...form, offerStartDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نهاية العرض</label>
                  <input type="date" value={form.offerEndDate}
                    onChange={(e) => setForm({ ...form, offerEndDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">التصنيف</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{language === 'ar' ? c.labelAr : c.labelEn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">القسم</label>
                  <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">عرض في الجريدة</label>
                <button onClick={() => setForm({ ...form, isFeaturedOnFlyer: !form.isFeaturedOnFlyer })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isFeaturedOnFlyer ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isFeaturedOnFlyer ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">الشارات</label>
                <div className="flex flex-wrap gap-2">
                  {BADGE_OPTIONS.map((b) => (
                    <button key={b.type} onClick={() => toggleBadge(b.type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${form.badges.includes(b.type) ? `${b.color} text-white ring-2` : 'bg-gray-100 text-gray-600'}`}>
                      {language === 'ar' ? b.labelAr : b.labelEn}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <button onClick={() => setShowBundle(!showBundle)}
                  className="flex items-center gap-2 text-sm font-medium w-full">
                  <Package size={16} />صفقة {showBundle ? <ChevronUp size={16} className="mr-auto" /> : <ChevronDown size={16} className="mr-auto" />}
                </button>
                {showBundle && (
                  <div className="mt-4 space-y-3">
                    <select value={form.bundleType} onChange={(e) => setForm({ ...form, bundleType: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300">
                      <option value="">لا يوجد</option>
                      <option value="buy_x_get_y">اشتر X واحصل على Y</option>
                      <option value="fixed_bundle_price">سعر ثابت للحزمة</option>
                      <option value="percentage_off_second">خصم على الثاني</option>
                    </select>
                    {form.bundleType === 'buy_x_get_y' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs">عدد الشراء</label><input type="number" value={form.buyQuantity} onChange={(e) => setForm({ ...form, buyQuantity: e.target.value })} className="w-full px-3 py-2 rounded-xl border" /></div>
                        <div><label className="block text-xs">عدد المجاني</label><input type="number" value={form.getQuantity} onChange={(e) => setForm({ ...form, getQuantity: e.target.value })} className="w-full px-3 py-2 rounded-xl border" /></div>
                      </div>
                    )}
                    {form.bundleType === 'fixed_bundle_price' && (
                      <div><label className="block text-xs">سعر الحزمة</label><input type="number" value={form.bundlePrice} onChange={(e) => setForm({ ...form, bundlePrice: e.target.value })} className="w-full px-3 py-2 rounded-xl border" /></div>
                    )}
                    {form.bundleType === 'percentage_off_second' && (
                      <div><label className="block text-xs">نسبة الخصم</label><input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} className="w-full px-3 py-2 rounded-xl border" /></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving || !form.name || !form.price}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Save size={18} />}
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </>
  );
}
