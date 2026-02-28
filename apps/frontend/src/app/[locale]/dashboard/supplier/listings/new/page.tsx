'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Category } from '@/types';
import { ChevronLeft, Package, X, Plus } from 'lucide-react';

const UNITS = ['piece', 'kg', 'ton', 'liter', 'meter', 'box', 'pallet', 'set', 'unit'];
const UNITS_AR = ['قطعة', 'كجم', 'طن', 'لتر', 'متر', 'صندوق', 'منصة', 'طقم', 'وحدة'];

export default function NewListingPage() {
  const locale = useLocale();
  const router = useRouter();
  const ar = locale === 'ar';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    categoryId: '',
    price: '',
    priceTo: '',
    unit: '',
    minOrderQty: '',
    leadTimeDays: '',
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [certs, setCerts] = useState<string[]>([]);
  const [certInput, setCertInput] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

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

  useEffect(() => {
    api.get('/categories').then((res) => {
      setCategories(res.data.data?.items || res.data.data || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/listings', {
        titleAr: form.titleAr,
        titleEn: form.titleEn,
        descriptionAr: form.descriptionAr || undefined,
        descriptionEn: form.descriptionEn || undefined,
        categoryId: form.categoryId || undefined,
        price: form.price ? Number(form.price) : undefined,
        priceTo: form.priceTo ? Number(form.priceTo) : undefined,
        currency: 'SAR',
        unit: form.unit || undefined,
        minOrderQty: form.minOrderQty ? Number(form.minOrderQty) : undefined,
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : undefined,
        tags: tags.length > 0 ? tags : undefined,
        certifications: certs.length > 0 ? certs : undefined,
      });
      const listing = res.data.data;
      router.push(`/${locale}/dashboard/supplier/listings`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || (ar ? 'حدث خطأ. حاول مجدداً.' : 'Failed to create listing.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/${locale}/dashboard/supplier/listings`} className="btn-ghost p-2">
            <ChevronLeft className="h-5 w-5 rtl-mirror" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{ar ? 'إضافة منتج جديد' : 'Add New Product'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {ar ? 'اعرض منتجاتك للمشترين في موازن' : 'Showcase your products to buyers on Mwazn'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Titles */}
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

          {/* Descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-base">{ar ? 'الوصف (عربي)' : 'Description (Arabic)'}</label>
              <textarea
                value={form.descriptionAr}
                onChange={(e) => set('descriptionAr', e.target.value)}
                rows={3}
                placeholder="وصف المنتج بالعربية..."
                className="input-base resize-none"
                dir="rtl"
              />
            </div>
            <div>
              <label className="label-base">{ar ? 'الوصف (إنجليزي)' : 'Description (English)'}</label>
              <textarea
                value={form.descriptionEn}
                onChange={(e) => set('descriptionEn', e.target.value)}
                rows={3}
                placeholder="Product description in English..."
                className="input-base resize-none"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label-base">{ar ? 'الفئة' : 'Category'}</label>
            <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="input-base">
              <option value="">{ar ? 'اختر الفئة' : 'Select category'}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{ar ? cat.nameAr : cat.nameEn}</option>
              ))}
            </select>
          </div>

          {/* Price range */}
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
              <label className="label-base">{ar ? 'الوحدة' : 'Unit'}</label>
              <select value={form.unit} onChange={(e) => set('unit', e.target.value)} className="input-base">
                <option value="">{ar ? 'اختر' : 'Select'}</option>
                {UNITS.map((u, i) => (
                  <option key={u} value={u}>{ar ? UNITS_AR[i] : u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">{ar ? 'أدنى كمية' : 'Min. Qty'}</label>
              <Input type="number" min="1" value={form.minOrderQty} onChange={(e) => set('minOrderQty', e.target.value)} placeholder="10" />
            </div>
          </div>

          {/* Lead time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">{ar ? 'مدة التسليم (أيام)' : 'Lead Time (days)'}</label>
              <Input type="number" min="1" value={form.leadTimeDays} onChange={(e) => set('leadTimeDays', e.target.value)} placeholder="7" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label-base">{ar ? 'الكلمات الدلالية' : 'Tags'}</label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder={ar ? 'مثال: صناعي، حديد...' : 'e.g. industrial, steel...'}
                className="flex-1"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addTag} icon={<Plus className="h-4 w-4" />}>
                {ar ? 'إضافة' : 'Add'}
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs text-brand-700">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-brand-400 hover:text-brand-700">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Certifications */}
          <div>
            <label className="label-base">{ar ? 'الشهادات والمعايير' : 'Certifications'}</label>
            <div className="flex gap-2">
              <Input
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
                placeholder={ar ? 'مثال: ISO 9001، SASO...' : 'e.g. ISO 9001, CE...'}
                className="flex-1"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addCert} icon={<Plus className="h-4 w-4" />}>
                {ar ? 'إضافة' : 'Add'}
              </Button>
            </div>
            {certs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {certs.map((cert) => (
                  <span key={cert} className="flex items-center gap-1 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs text-green-700">
                    {cert}
                    <button type="button" onClick={() => removeCert(cert)} className="text-green-400 hover:text-green-700">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link href={`/${locale}/dashboard/supplier/listings`}>
              <Button variant="secondary">{ar ? 'إلغاء' : 'Cancel'}</Button>
            </Link>
            <Button
              type="submit"
              loading={loading}
              icon={<Package className="h-4 w-4" />}
              disabled={!form.titleAr || !form.titleEn}
            >
              {ar ? 'نشر المنتج' : 'Publish Product'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
