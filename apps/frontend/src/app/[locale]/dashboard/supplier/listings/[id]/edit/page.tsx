'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Category, SpecEntry } from '@/types';
import { ChevronLeft, Package, X, Plus } from 'lucide-react';

const UNITS = ['piece', 'kg', 'ton', 'liter', 'meter', 'box', 'pallet', 'set', 'unit'];
const UNITS_AR = ['قطعة', 'كجم', 'طن', 'لتر', 'متر', 'صندوق', 'منصة', 'طقم', 'وحدة'];

const STOCK_OPTIONS = [
  { value: 'IN_STOCK', en: 'In Stock', ar: 'متاح' },
  { value: 'LIMITED', en: 'Limited Availability', ar: 'كميات محدودة' },
  { value: 'OUT_OF_STOCK', en: 'Out of Stock', ar: 'غير متاح' },
];

export default function EditListingPage() {
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const ar = locale === 'ar';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    titleAr: '', titleEn: '',
    descriptionAr: '', descriptionEn: '',
    categoryId: '', sku: '',
    price: '', priceTo: '', unit: '',
    minOrderQty: '', leadTimeDays: '',
    vatPercent: '15',
    requestQuoteOnly: false,
    stockAvailability: 'IN_STOCK',
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [certs, setCerts] = useState<string[]>([]);
  const [certInput, setCertInput] = useState('');
  const [specs, setSpecs] = useState<SpecEntry[]>([{ key: '', value: '' }]);

  const set = (k: keyof typeof form, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));
  const addCert = () => {
    const c = certInput.trim();
    if (c && !certs.includes(c)) setCerts((prev) => [...prev, c]);
    setCertInput('');
  };
  const removeCert = (c: string) => setCerts((prev) => prev.filter((x) => x !== c));

  const updateSpec = (i: number, field: 'key' | 'value', val: string) =>
    setSpecs((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const addSpec = () => setSpecs((p) => [...p, { key: '', value: '' }]);
  const removeSpec = (i: number) => setSpecs((p) => p.filter((_, idx) => idx !== i));

  useEffect(() => {
    const loadData = async () => {
      try {
        const [listingRes, catsRes] = await Promise.all([
          api.get(`/listings/${id}`),
          api.get('/categories'),
        ]);
        const l = listingRes.data.data;
        setForm({
          titleAr: l.titleAr ?? '',
          titleEn: l.titleEn ?? '',
          descriptionAr: l.descriptionAr ?? '',
          descriptionEn: l.descriptionEn ?? '',
          categoryId: l.categoryId ?? '',
          sku: l.sku ?? '',
          price: l.price != null ? String(l.price) : '',
          priceTo: l.priceTo != null ? String(l.priceTo) : '',
          unit: l.unit ?? '',
          minOrderQty: l.minOrderQty != null ? String(l.minOrderQty) : '',
          leadTimeDays: l.leadTimeDays != null ? String(l.leadTimeDays) : '',
          vatPercent: l.vatPercent != null ? String(l.vatPercent) : '15',
          requestQuoteOnly: l.requestQuoteOnly ?? false,
          stockAvailability: l.stockAvailability ?? 'IN_STOCK',
        });
        setTags(l.tags ?? []);
        setCerts(l.certifications ?? []);
        if (l.specsJson && l.specsJson.length > 0) {
          setSpecs(l.specsJson);
        }
        setCategories(catsRes.data.data?.items || catsRes.data.data || []);
      } catch { /* silent */ }
      setLoadingData(false);
    };
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const validSpecs = specs.filter((s) => s.key && s.value);
      await api.patch(`/listings/${id}`, {
        titleAr: form.titleAr, titleEn: form.titleEn,
        descriptionAr: form.descriptionAr || undefined,
        descriptionEn: form.descriptionEn || undefined,
        categoryId: form.categoryId || undefined,
        sku: form.sku || undefined,
        price: form.requestQuoteOnly ? undefined : (form.price ? Number(form.price) : undefined),
        priceTo: form.requestQuoteOnly ? undefined : (form.priceTo ? Number(form.priceTo) : undefined),
        unit: form.unit || undefined,
        minOrderQty: form.minOrderQty ? Number(form.minOrderQty) : undefined,
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
        vatPercent: form.vatPercent ? Number(form.vatPercent) : undefined,
        requestQuoteOnly: form.requestQuoteOnly,
        stockAvailability: form.stockAvailability,
        tags: tags.length > 0 ? tags : undefined,
        certifications: certs.length > 0 ? certs : undefined,
        specsJson: validSpecs.length > 0 ? validSpecs : undefined,
      });
      router.push(`/${locale}/dashboard/supplier/listings`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || (ar ? 'حدث خطأ. حاول مجدداً.' : 'Failed to update listing.'));
    } finally { setLoading(false); }
  };

  if (loadingData) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/${locale}/dashboard/supplier/listings`} className="btn-ghost p-2">
            <ChevronLeft className="h-5 w-5 rtl-mirror" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{ar ? 'تعديل المنتج' : 'Edit Product'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{ar ? 'حدّث بيانات منتجك' : 'Update your product details'}</p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Section 1: Basic Info ────────────────────────────── */}
          <div className="card space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">{ar ? 'معلومات المنتج' : 'Product Information'}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-base">{ar ? 'اسم المنتج (عربي) *' : 'Product Name (Arabic) *'}</label>
                <Input value={form.titleAr} onChange={(e) => set('titleAr', e.target.value)} placeholder="مثال: أنابيب PVC" dir="rtl" required />
              </div>
              <div>
                <label className="label-base">{ar ? 'اسم المنتج (إنجليزي) *' : 'Product Name (English) *'}</label>
                <Input value={form.titleEn} onChange={(e) => set('titleEn', e.target.value)} placeholder="e.g. PVC Pipes" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base">{ar ? 'الفئة' : 'Category'}</label>
                <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="input-base">
                  <option value="">{ar ? 'اختر الفئة' : 'Select category'}</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{ar ? cat.nameAr : cat.nameEn}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">{ar ? 'رمز المنتج (SKU)' : 'SKU / Product Code'}</label>
                <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="e.g. PVC-110-3M" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-base">{ar ? 'الوصف (عربي)' : 'Description (Arabic)'}</label>
                <textarea value={form.descriptionAr} onChange={(e) => set('descriptionAr', e.target.value)} rows={3} placeholder="وصف المنتج بالعربية..." className="input-base resize-none" dir="rtl" />
              </div>
              <div>
                <label className="label-base">{ar ? 'الوصف (إنجليزي)' : 'Description (English)'}</label>
                <textarea value={form.descriptionEn} onChange={(e) => set('descriptionEn', e.target.value)} rows={3} placeholder="Product description in English..." className="input-base resize-none" />
              </div>
            </div>
          </div>

          {/* ── Section 2: Pricing ──────────────────────────────── */}
          <div className="card space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">{ar ? 'السعر والتوافر' : 'Pricing & Availability'}</h2>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.requestQuoteOnly} onChange={(e) => set('requestQuoteOnly', e.target.checked)} className="rounded border-slate-300 text-brand-700" />
              <span className="text-sm text-slate-700 font-medium">{ar ? 'طلب عرض سعر (بدون سعر معروض)' : '"Request Quote" only — hide price'}</span>
            </label>

            {!form.requestQuoteOnly && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="label-base">{ar ? 'السعر من (ريال)' : 'Price From (SAR)'}</label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="150.00" />
                </div>
                <div>
                  <label className="label-base">{ar ? 'السعر إلى' : 'Price To'}</label>
                  <Input type="number" min="0" step="0.01" value={form.priceTo} onChange={(e) => set('priceTo', e.target.value)} placeholder="500.00" />
                </div>
                <div>
                  <label className="label-base">{ar ? 'ضريبة القيمة المضافة (%)' : 'VAT (%)'}</label>
                  <Input type="number" min="0" max="100" step="0.1" value={form.vatPercent} onChange={(e) => set('vatPercent', e.target.value)} placeholder="15" />
                </div>
                <div className="flex flex-col justify-end">
                  {form.price && form.vatPercent && (
                    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
                      <p>{ar ? 'السعر مع الضريبة' : 'Price incl. VAT'}</p>
                      <p className="font-bold text-slate-800 text-sm">{(Number(form.price) * (1 + Number(form.vatPercent) / 100)).toLocaleString()} SAR</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="label-base">{ar ? 'الوحدة' : 'Unit'}</label>
                <select value={form.unit} onChange={(e) => set('unit', e.target.value)} className="input-base">
                  <option value="">{ar ? 'اختر' : 'Select'}</option>
                  {UNITS.map((u, i) => <option key={u} value={u}>{ar ? UNITS_AR[i] : u}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">{ar ? 'أدنى كمية' : 'Min. Order Qty'}</label>
                <Input type="number" min="1" value={form.minOrderQty} onChange={(e) => set('minOrderQty', e.target.value)} placeholder="10" />
              </div>
              <div>
                <label className="label-base">{ar ? 'مدة التسليم (أيام)' : 'Lead Time (days)'}</label>
                <Input type="number" min="1" value={form.leadTimeDays} onChange={(e) => set('leadTimeDays', e.target.value)} placeholder="7" />
              </div>
              <div>
                <label className="label-base">{ar ? 'التوافر' : 'Stock Availability'}</label>
                <select value={form.stockAvailability} onChange={(e) => set('stockAvailability', e.target.value)} className="input-base">
                  {STOCK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{ar ? o.ar : o.en}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Section 3: Specifications ───────────────────────── */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">{ar ? 'المواصفات التقنية' : 'Technical Specifications'}</h2>
            {specs.map((spec, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-center">
                <div className="col-span-2">
                  <Input value={spec.key} onChange={(e) => updateSpec(i, 'key', e.target.value)} placeholder={ar ? 'المواصفة' : 'Property'} />
                </div>
                <div className="col-span-2">
                  <Input value={spec.value} onChange={(e) => updateSpec(i, 'value', e.target.value)} placeholder={ar ? 'القيمة' : 'Value'} />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button type="button" onClick={() => removeSpec(i)} disabled={specs.length === 1} className="text-slate-400 hover:text-red-500 disabled:opacity-30">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addSpec} icon={<Plus className="h-4 w-4" />}>{ar ? 'إضافة مواصفة' : 'Add Spec'}</Button>
          </div>

          {/* ── Section 4: Tags & Certifications ───────────────── */}
          <div className="card space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">{ar ? 'الكلمات الدلالية والشهادات' : 'Tags & Certifications'}</h2>

            <div>
              <label className="label-base">{ar ? 'الكلمات الدلالية' : 'Tags'}</label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder={ar ? 'مثال: صناعي، حديد...' : 'e.g. industrial, steel...'} className="flex-1" />
                <Button type="button" variant="secondary" size="sm" onClick={addTag} icon={<Plus className="h-4 w-4" />}>{ar ? 'إضافة' : 'Add'}</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => <span key={tag} className="flex items-center gap-1 rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs text-brand-700">{tag}<button type="button" onClick={() => removeTag(tag)} className="text-brand-400 hover:text-brand-700"><X className="h-3 w-3" /></button></span>)}
                </div>
              )}
            </div>

            <div>
              <label className="label-base">{ar ? 'الشهادات والمعايير' : 'Certifications & Standards'}</label>
              <div className="flex gap-2">
                <Input value={certInput} onChange={(e) => setCertInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }} placeholder={ar ? 'مثال: ISO 9001، SASO...' : 'e.g. ISO 9001, CE...'} className="flex-1" />
                <Button type="button" variant="secondary" size="sm" onClick={addCert} icon={<Plus className="h-4 w-4" />}>{ar ? 'إضافة' : 'Add'}</Button>
              </div>
              {certs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {certs.map((cert) => <span key={cert} className="flex items-center gap-1 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs text-green-700">{cert}<button type="button" onClick={() => removeCert(cert)} className="text-green-400 hover:text-green-700"><X className="h-3 w-3" /></button></span>)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link href={`/${locale}/dashboard/supplier/listings`}><Button variant="secondary">{ar ? 'إلغاء' : 'Cancel'}</Button></Link>
            <Button type="submit" loading={loading} icon={<Package className="h-4 w-4" />} disabled={!form.titleAr || !form.titleEn}>
              {ar ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
