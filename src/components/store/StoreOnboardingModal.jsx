import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { compressImage, fileToDataUrl } from '../../utils/imageCompressor';
import api from '../../utils/api';
import { Check, Upload, X, Image, Calendar, Layout } from 'lucide-react';

const TEMPLATE_THUMBNAILS = [
  { id: 1, name: 'كلاسيك', color: 'bg-gray-100 border-gray-400' },
  { id: 2, name: 'حديث', color: 'bg-gradient-to-br from-pink-300 to-blue-300' },
  { id: 3, name: 'بسيط', color: 'bg-white border-gray-200' },
  { id: 4, name: 'تقليدي', color: 'bg-amber-50 border-amber-700' },
  { id: 5, name: 'كتالوج', color: 'bg-blue-600' },
];

export default function StoreOnboardingModal({ open, onComplete }) {
  const { direction, language } = useLanguage();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({ logo: '', cover: '', phone: '', whatsapp: '', email: '' });
  const [flyer, setFlyer] = useState({ template: 1, startDate: '', endDate: '' });
  const [product, setProduct] = useState({ name: '', price: '', image: '', offerEndDate: '' });
  const [logoPreview, setLogoPreview] = useState(null);
  const [productPreview, setProductPreview] = useState(null);

  if (!open) return null;

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    try {
      const compressed = await compressImage(file);
      const res = await api.post('/store/upload', { image: compressed.dataUrl });
      setProfile((p) => ({ ...p, logo: res.data.url || res.data.imageUrl }));
    } catch (err) { console.error('Logo upload failed:', err.response?.data || err.message); }
  };

  const handleProductImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProductPreview(URL.createObjectURL(file));
    try {
      const compressed = await compressImage(file);
      const res = await api.post('/store/upload', { image: compressed.dataUrl });
      setProduct((p) => ({ ...p, image: res.data.url || res.data.imageUrl }));
    } catch (err) { console.error('Product image upload failed:', err.response?.data || err.message); }
  };

  const saveStep1 = async () => {
    setSaving(true);
    try { await api.put('/store/profile', profile); } catch {}
    setSaving(false);
    setStep(2);
  };

  const saveStep2 = async () => {
    setSaving(true);
    try {
      await api.put('/store/flyer', {
        selectedTemplate: flyer.template,
        currentFlyerStart: flyer.startDate || undefined,
        currentFlyerEnd: flyer.endDate || undefined,
      });
    } catch {}
    setSaving(false);
    setStep(3);
  };

  const saveStep3 = async () => {
    if (!product.name || !product.price) return;
    setSaving(true);
    try {
      await api.post('/store/products', {
        ...product,
        price: parseFloat(product.price),
        offerEndDate: product.offerEndDate || undefined,
        isFeaturedOnFlyer: true,
      });
    } catch {}
    setSaving(false);
    setStep(4);
  };

  const finish = async () => {
    try { await api.put('/store/profile', { onboardingStep: 4 }); } catch {}
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" dir={direction}>
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>
          <button onClick={finish} className="text-sm text-gray-400 hover:text-gray-600">
            {language === 'ar' ? 'تخطي' : 'Skip'}
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">{language === 'ar' ? 'أكمل ملف متجرك' : 'Complete Your Store Profile'}</h2>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'أضف شعار المتجر ومعلومات التواصل' : 'Add your logo and contact info'}</p>

            <div onClick={() => document.getElementById('logo-input')?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer">
              <input id="logo-input" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              {logoPreview ? <img src={logoPreview} className="w-20 h-20 object-cover rounded-full mx-auto" /> : <Upload size={28} className="mx-auto text-gray-400" />}
              <p className="text-xs text-gray-500 mt-1">{language === 'ar' ? 'شعار المتجر' : 'Store Logo'}</p>
            </div>

            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300" placeholder={language === 'ar' ? 'رقم الجوال' : 'Phone'} />
            <input value={profile.whatsapp} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300" placeholder="WhatsApp" />
            <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300" placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'} />

            <button onClick={saveStep1} disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50">
              {saving ? '...' : language === 'ar' ? 'التالي' : 'Next'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">{language === 'ar' ? 'صمم جريدتك' : 'Design Your Flyer'}</h2>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'اختر قالب الجريدة وحدد تاريخ العروض' : 'Pick a template and set dates'}</p>

            <div className="grid grid-cols-5 gap-2">
              {TEMPLATE_THUMBNAILS.map((t) => (
                <button key={t.id} onClick={() => setFlyer({ ...flyer, template: t.id })}
                  className={`aspect-[3/4] rounded-lg border-2 flex items-center justify-center text-[10px] font-medium transition-all ${
                    flyer.template === t.id ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-200'
                  } ${t.color}`}>
                  {t.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1">{language === 'ar' ? 'تاريخ البداية' : 'Start Date'}</label>
                <input type="date" value={flyer.startDate} onChange={(e) => setFlyer({ ...flyer, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs mb-1">{language === 'ar' ? 'تاريخ النهاية' : 'End Date'}</label>
                <input type="date" value={flyer.endDate} onChange={(e) => setFlyer({ ...flyer, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm">
                {language === 'ar' ? 'السابق' : 'Back'}
              </button>
              <button onClick={saveStep2} disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
                {saving ? '...' : language === 'ar' ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">{language === 'ar' ? 'أضف أول منتج' : 'Add Your First Product'}</h2>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'أضف منتجاً واحداً على الأقل للبدء' : 'Add at least one product to get started'}</p>

            <input value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300" placeholder={language === 'ar' ? 'اسم المنتج' : 'Product name'} />

            <input type="number" step="0.01" value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300" placeholder={language === 'ar' ? 'السعر (ريال)' : 'Price (SAR)'} />

            <div onClick={() => document.getElementById('product-img-input')?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer">
              <input id="product-img-input" type="file" accept="image/*" onChange={handleProductImage} className="hidden" />
              {productPreview ? <img src={productPreview} className="w-24 h-24 object-cover rounded-lg mx-auto" /> : <Image size={24} className="mx-auto text-gray-400" />}
              <p className="text-xs text-gray-500">{language === 'ar' ? 'صورة المنتج' : 'Product image'}</p>
            </div>

            <input type="date" value={product.offerEndDate} onChange={(e) => setProduct({ ...product, offerEndDate: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm" />

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm">
                {language === 'ar' ? 'السابق' : 'Back'}
              </button>
              <button onClick={saveStep3} disabled={saving || !product.name || !product.price}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">
                {saving ? '...' : language === 'ar' ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold">{language === 'ar' ? 'أنت جاهز!' : 'You\'re All Set!'}</h2>
            <p className="text-gray-500">{language === 'ar' ? 'أهلاً بك في المنصة! جريدتك جاهزة لاستقبال الزوار.' : 'Welcome! Your flyer is ready for visitors.'}</p>
            <button onClick={finish}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium">
              {language === 'ar' ? 'اذهب للوحة التحكم' : 'Go to Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
