'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Category } from '@/types';
import { FileText, ChevronLeft, Layers, ImagePlus, X, Plus, Info } from 'lucide-react';
import Link from 'next/link';

const UNITS = ['piece', 'kg', 'ton', 'liter', 'meter', 'box', 'pallet', 'set', 'unit'];
const UNITS_AR = ['قطعة', 'كجم', 'طن', 'لتر', 'متر', 'صندوق', 'منصة', 'طقم', 'وحدة'];

const PROJECT_TYPES = [
  { value: 'PRODUCT', en: 'Product Supply', ar: 'توريد منتجات' },
  { value: 'SERVICE', en: 'Service', ar: 'خدمات' },
  { value: 'MANUFACTURING', en: 'Manufacturing', ar: 'تصنيع' },
  { value: 'CONSULTANCY', en: 'Consultancy', ar: 'استشارات' },
];

const TEMPLATES = [
  { id: 'construction', icon: '🏗️', label: { en: 'Construction Materials', ar: 'مواد بناء' }, form: { title: 'Request for Construction Materials', description: 'We require construction materials for our ongoing project. Please provide your best offer including specifications, delivery timeline, and payment terms. All materials must comply with Saudi SASO standards.', unit: 'ton', quantity: '500', projectType: 'PRODUCT' } },
  { id: 'it', icon: '💻', label: { en: 'IT Equipment', ar: 'معدات تقنية' }, form: { title: 'Request for IT Equipment & Supplies', description: 'We are seeking quotes for IT hardware and equipment. All equipment must be brand new with manufacturer warranty.', unit: 'piece', quantity: '50', projectType: 'PRODUCT' } },
  { id: 'office', icon: '🪑', label: { en: 'Office Furniture', ar: 'أثاث مكتبي' }, form: { title: 'Request for Office Furniture and Equipment', description: 'We require office furniture for our new office space. All items must meet quality standards and include assembly/delivery.', unit: 'set', quantity: '20', projectType: 'PRODUCT' } },
  { id: 'food', icon: '🥗', label: { en: 'Food & Beverages', ar: 'أغذية ومشروبات' }, form: { title: 'Monthly Food & Beverage Supply Contract', description: 'Looking for a reliable food and beverage supplier. All products must comply with SFDA regulations and have valid halal certification.', unit: 'kg', quantity: '1000', projectType: 'PRODUCT' } },
  { id: 'safety', icon: '🦺', label: { en: 'Safety Equipment', ar: 'معدات السلامة' }, form: { title: 'Request for Safety & PPE Equipment', description: 'Require PPE and safety supplies for our workforce. All equipment must meet Saudi SASO standards.', unit: 'piece', quantity: '200', projectType: 'PRODUCT' } },
  { id: 'service', icon: '⚙️', label: { en: 'Professional Service', ar: 'خدمة مهنية' }, form: { title: 'Request for Professional Services', description: 'We require professional services as detailed below. Please include your methodology, team qualifications, timeline, and pricing.', unit: 'unit', quantity: '1', projectType: 'SERVICE' } },
];

const COMMON_CERTS = ['ISO 9001', 'ISO 14001', 'SASO', 'SFDA', 'Halal', 'CE', 'OHSAS 18001', 'ISO 45001'];

export default function NewRFQPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ar = locale === 'ar';
  const { company, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && company && company.type !== 'BUYER') {
      router.replace(`/${locale}/dashboard/supplier`);
    }
  }, [isLoading, company, locale, router]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [requiredCerts, setRequiredCerts] = useState<string[]>([]);
  const [certInput, setCertInput] = useState('');

  const [form, setForm] = useState({
    title: searchParams?.get('title') || '',
    description: '',
    categoryId: searchParams?.get('categoryId') || '',
    projectType: 'PRODUCT',
    quantity: '',
    unit: '',
    // Budget
    budgetMin: '',
    budgetMax: '',
    budgetUndisclosed: false,
    vatIncluded: false,
    currency: 'SAR',
    // Dates
    deadline: '',
    expectedStartDate: '',
    // Location & requirements
    locationRequirement: '',
    siteVisitRequired: false,
    ndaRequired: false,
    // Visibility
    visibility: 'PUBLIC',
    allowPartialBids: true,
  });

  const set = (k: keyof typeof form, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data?.items || res.data.data || [])).catch(() => {});
  }, []);

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setSelectedTemplate(tpl.id);
    setForm((p) => ({
      ...p,
      title: ar ? `طلب: ${tpl.label.ar}` : tpl.form.title,
      description: tpl.form.description,
      unit: tpl.form.unit,
      quantity: tpl.form.quantity,
      projectType: (tpl.form as any).projectType || 'PRODUCT',
    }));
  };

  const addCert = (val: string) => {
    const t = val.trim();
    if (t && !requiredCerts.includes(t)) setRequiredCerts((p) => [...p, t]);
    setCertInput('');
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    setImageError('');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const newFiles: File[] = [];
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (pendingFiles.length + newFiles.length >= 8) { setImageError(ar ? 'الحد الأقصى 8 ملفات' : 'Maximum 8 files allowed'); break; }
      if (!allowed.includes(file.type)) { setImageError(ar ? 'نوع الملف غير مدعوم (صور أو PDF)' : 'Only images and PDF files are allowed'); continue; }
      if (file.size > 10 * 1024 * 1024) { setImageError(ar ? 'حجم الملف أكبر من 10 ميجابايت' : 'Each file must be under 10 MB'); continue; }
      newFiles.push(file);
      newUrls.push(file.type.startsWith('image/') ? URL.createObjectURL(file) : '');
    }
    setPendingFiles((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  };

  const removeFile = (index: number) => {
    if (previewUrls[index]) URL.revokeObjectURL(previewUrls[index]);
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId || undefined,
        projectType: form.projectType || undefined,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        unit: form.unit || undefined,
        currency: form.currency,
        deadline: form.deadline || undefined,
        expectedStartDate: form.expectedStartDate || undefined,
        locationRequirement: form.locationRequirement || undefined,
        siteVisitRequired: form.siteVisitRequired,
        ndaRequired: form.ndaRequired,
        requiredCertifications: requiredCerts.length > 0 ? requiredCerts : undefined,
        visibility: form.visibility,
        allowPartialBids: form.allowPartialBids,
        budgetUndisclosed: form.budgetUndisclosed,
        vatIncluded: form.vatIncluded,
      };
      if (!form.budgetUndisclosed) {
        if (form.budgetMin) payload.budgetMin = Number(form.budgetMin);
        if (form.budgetMax) payload.budgetMax = Number(form.budgetMax);
        if (!form.budgetMin && !form.budgetMax && form.budgetMin) payload.budget = Number(form.budgetMin);
      }

      const res = await api.post('/rfqs', payload);
      const rfqId = res.data.data?.id;
      if (pendingFiles.length > 0 && rfqId) {
        const fd = new FormData();
        pendingFiles.forEach((f) => fd.append('images', f));
        await api.post(`/rfqs/${rfqId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      previewUrls.forEach((u) => { if (u) URL.revokeObjectURL(u); });
      if (rfqId) {
        router.push(`/${locale}/dashboard/buyer/rfqs/${rfqId}?posted=1`);
      } else {
        router.push(`/${locale}/dashboard/buyer/rfqs`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || (ar ? 'حدث خطأ. حاول مجدداً.' : 'Failed to create RFQ. Please try again.'));
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/${locale}/dashboard/buyer/rfqs`} className="btn-ghost p-2">
            <ChevronLeft className="h-5 w-5 rtl-mirror" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{ar ? 'طلب عرض سعر جديد' : 'Create New RFQ'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{ar ? 'أخبر الموردين بما تحتاجه بدقة' : 'Tell suppliers exactly what you need'}</p>
          </div>
        </div>

        {/* Templates */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />{ar ? 'قوالب جاهزة للقطاعات' : 'Quick-Start Templates'}
          </p>
          <div className="flex gap-2 flex-wrap">
            {TEMPLATES.map((tpl) => (
              <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${selectedTemplate === tpl.id ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50'}`}>
                <span>{tpl.icon}</span>{ar ? tpl.label.ar : tpl.label.en}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Section 1: Basic Info ──────────────────────────────── */}
          <div className="card space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">{ar ? 'المعلومات الأساسية' : 'Basic Information'}</h2>

            <div>
              <label className="label-base">{ar ? 'عنوان الطلب *' : 'RFQ Title *'}</label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={ar ? 'مثال: مطلوب مواد بناء لمشروع الرياض' : 'e.g. Steel pipes for Riyadh construction project'} required />
            </div>

            <div>
              <label className="label-base">{ar ? 'وصف تفصيلي للمتطلبات *' : 'Detailed Requirements *'}</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5}
                placeholder={ar ? 'اذكر المواصفات الدقيقة، معايير الجودة، شروط التسليم، والمستلزمات الخاصة...' : 'Describe exact specifications, quality standards, delivery terms, and special requirements...'}
                className="input-base resize-none" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base">{ar ? 'الفئة *' : 'Category *'}</label>
                <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="input-base">
                  <option value="">{ar ? 'اختر الفئة' : 'Select a category'}</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{ar ? cat.nameAr : cat.nameEn}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">{ar ? 'نوع المشروع' : 'Project Type'}</label>
                <select value={form.projectType} onChange={(e) => set('projectType', e.target.value)} className="input-base">
                  {PROJECT_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{ar ? pt.ar : pt.en}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base">{ar ? 'الكمية' : 'Quantity'}</label>
                <Input type="number" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="100" />
              </div>
              <div>
                <label className="label-base">{ar ? 'الوحدة' : 'Unit'}</label>
                <select value={form.unit} onChange={(e) => set('unit', e.target.value)} className="input-base">
                  <option value="">{ar ? 'اختر' : 'Select'}</option>
                  {UNITS.map((u, i) => <option key={u} value={u}>{ar ? UNITS_AR[i] : u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Section 2: Budget ──────────────────────────────────── */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">{ar ? 'الميزانية والمدة' : 'Budget & Timeline'}</h2>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.budgetUndisclosed} onChange={(e) => set('budgetUndisclosed', e.target.checked)} className="rounded border-slate-300 text-brand-700" />
              <span className="text-sm text-slate-700">{ar ? 'الميزانية غير معلنة (سيطّلع عليها الموردون بعد تقديم عرضهم)' : 'Budget undisclosed (suppliers see it after quoting)'}</span>
            </label>

            {!form.budgetUndisclosed && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-base">{ar ? 'الحد الأدنى للميزانية (ريال)' : 'Budget Min (SAR)'}</label>
                  <Input type="number" min="0" value={form.budgetMin} onChange={(e) => set('budgetMin', e.target.value)} placeholder="10,000" />
                </div>
                <div>
                  <label className="label-base">{ar ? 'الحد الأقصى للميزانية (ريال)' : 'Budget Max (SAR)'}</label>
                  <Input type="number" min="0" value={form.budgetMax} onChange={(e) => set('budgetMax', e.target.value)} placeholder="50,000" />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input type="checkbox" checked={form.vatIncluded} onChange={(e) => set('vatIncluded', e.target.checked)} className="rounded border-slate-300 text-brand-700" />
                    <span className="text-sm text-slate-700">{ar ? 'يشمل ضريبة القيمة المضافة' : 'Incl. VAT'}</span>
                  </label>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base">{ar ? 'آخر موعد لتقديم العروض' : 'Bid Closing Date'}</label>
                <Input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="label-base">{ar ? 'تاريخ البدء المتوقع' : 'Expected Start Date'}</label>
                <Input type="date" value={form.expectedStartDate} onChange={(e) => set('expectedStartDate', e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>

          {/* ── Section 3: Requirements ────────────────────────────── */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">{ar ? 'متطلبات إضافية' : 'Additional Requirements'}</h2>

            <div>
              <label className="label-base">{ar ? 'موقع التسليم / المنطقة المطلوبة' : 'Delivery Location / Region Required'}</label>
              <Input value={form.locationRequirement} onChange={(e) => set('locationRequirement', e.target.value)} placeholder={ar ? 'مثال: الرياض — حي العليا' : 'e.g. Riyadh — Al Olaya District'} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-start gap-2 cursor-pointer rounded-xl border border-slate-200 p-3 hover:border-brand-300 transition-colors">
                <input type="checkbox" checked={form.siteVisitRequired} onChange={(e) => set('siteVisitRequired', e.target.checked)} className="mt-0.5 rounded border-slate-300 text-brand-700" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{ar ? 'زيارة موقع مطلوبة' : 'Site Visit Required'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ar ? 'سيُطلب من الموردين زيارة الموقع قبل التقديم' : 'Suppliers must visit site before quoting'}</p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer rounded-xl border border-slate-200 p-3 hover:border-brand-300 transition-colors">
                <input type="checkbox" checked={form.ndaRequired} onChange={(e) => set('ndaRequired', e.target.checked)} className="mt-0.5 rounded border-slate-300 text-brand-700" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{ar ? 'اتفاقية سرية (NDA)' : 'NDA Required'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ar ? 'يجب على الموردين التوقيع على اتفاقية سرية' : 'Suppliers must sign a non-disclosure agreement'}</p>
                </div>
              </label>
            </div>

            {/* Required certifications */}
            <div>
              <label className="label-base">{ar ? 'الشهادات المطلوبة من المورد' : 'Required Supplier Certifications'}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {COMMON_CERTS.map((cert) => (
                  <button key={cert} type="button" onClick={() => { if (!requiredCerts.includes(cert)) setRequiredCerts((p) => [...p, cert]); }}
                    className={`rounded-full border px-3 py-1 text-xs transition-all ${requiredCerts.includes(cert) ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                    {cert}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={certInput} onChange={(e) => setCertInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCert(certInput); } }}
                  placeholder={ar ? 'شهادة أخرى...' : 'Other certification...'} className="flex-1" />
                <Button type="button" variant="secondary" size="sm" onClick={() => addCert(certInput)} icon={<Plus className="h-4 w-4" />}>{ar ? 'إضافة' : 'Add'}</Button>
              </div>
              {requiredCerts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {requiredCerts.map((c) => (
                    <span key={c} className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs text-green-700">
                      {c}<button type="button" onClick={() => setRequiredCerts((p) => p.filter((x) => x !== c))} className="text-green-400 hover:text-green-700"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Section 4: Visibility ──────────────────────────────── */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">{ar ? 'إعدادات العرض' : 'Submission Settings'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-start gap-3 cursor-pointer rounded-xl border-2 p-3 transition-all ${form.visibility === 'PUBLIC' ? 'border-brand-700 bg-brand-50' : 'border-slate-200'}`}>
                <input type="radio" name="visibility" value="PUBLIC" checked={form.visibility === 'PUBLIC'} onChange={() => set('visibility', 'PUBLIC')} className="mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{ar ? 'عام' : 'Public'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ar ? 'جميع الموردين الموثقين يمكنهم رؤية الطلب' : 'All verified suppliers can see and quote'}</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 cursor-pointer rounded-xl border-2 p-3 transition-all ${form.visibility === 'INVITE_ONLY' ? 'border-brand-700 bg-brand-50' : 'border-slate-200'}`}>
                <input type="radio" name="visibility" value="INVITE_ONLY" checked={form.visibility === 'INVITE_ONLY'} onChange={() => set('visibility', 'INVITE_ONLY')} className="mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{ar ? 'بالدعوة فقط' : 'Invite Only'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ar ? 'يقدّم العروض الموردون المدعوون فقط' : 'Only invited suppliers can quote'}</p>
                </div>
              </label>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.allowPartialBids} onChange={(e) => set('allowPartialBids', e.target.checked)} className="rounded border-slate-300 text-brand-700" />
              <span className="text-sm text-slate-700">{ar ? 'قبول العروض الجزئية (عروض لجزء من الطلب)' : 'Allow partial bids (suppliers can quote on part of the RFQ)'}</span>
            </label>
          </div>

          {/* ── Section 5: Attachments ─────────────────────────────── */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">{ar ? 'المرفقات (صور، مواصفات، رسومات)' : 'Attachments (images, specs, drawings)'}</h2>
            <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
            {imageError && <p className="text-xs text-red-500">{imageError}</p>}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFileChange(e.dataTransfer.files); }}
              className="w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-colors px-4 py-6 flex flex-col items-center gap-2 text-slate-400">
              <ImagePlus className="h-6 w-6" />
              <p className="text-sm font-medium">{ar ? 'اضغط لإضافة ملفات أو اسحب وأفلت' : 'Click to add files or drag & drop'}</p>
              <p className="text-xs">{ar ? 'صور، PDF — حتى 8 ملفات، 10 ميجابايت لكل ملف' : 'Images, PDF — up to 8 files, 10 MB each'}</p>
            </button>
            {pendingFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-square flex items-center justify-center">
                    {previewUrls[i] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrls[i]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2"><FileText className="h-6 w-6 text-slate-400 mx-auto" /><p className="text-xs text-slate-500 mt-1 truncate px-1">{file.name}</p></div>
                    )}
                    <button type="button" onClick={() => removeFile(i)} className="absolute top-1 end-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5"><Info className="h-3.5 w-3.5" />{ar ? 'نصائح للحصول على أفضل العروض' : 'Tips for better quotes'}</p>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
              {(ar ? ['كن محدداً في المواصفات والكميات', 'اذكر معايير الجودة المطلوبة (SASO، ISO...)', 'حدد تاريخ البدء المتوقع وموعد التسليم', 'أرفق مواصفات أو رسومات إن وجدت'] : ['Be specific about specifications and quantities', 'Mention required quality standards (SASO, ISO...)', 'Include expected start date and delivery deadline', 'Attach BOQ, specs sheets or drawings if available']).map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <Link href={`/${locale}/dashboard/buyer/rfqs`}><Button variant="secondary">{ar ? 'إلغاء' : 'Cancel'}</Button></Link>
            <Button type="submit" loading={loading} icon={<FileText className="h-4 w-4" />} disabled={!form.title || !form.description}>
              {ar ? 'نشر الطلب' : 'Post RFQ'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
