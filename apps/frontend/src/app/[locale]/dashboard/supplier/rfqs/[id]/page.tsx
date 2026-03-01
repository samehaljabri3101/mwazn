'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import type { RFQ, QuoteLineItem } from '@/types';
import { ChevronLeft, Calendar, Tag, DollarSign, Package, SendHorizonal, Zap, AlertTriangle, Plus, X, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

const PAYMENT_TERMS_OPTIONS = [
  { value: '30 days net', ar: '30 يوم صافي' },
  { value: '50% upfront, 50% on delivery', ar: '50% مقدم، 50% عند التسليم' },
  { value: '100% upfront', ar: '100% مقدم' },
  { value: 'Letter of credit', ar: 'خطاب اعتماد' },
  { value: 'COD (Cash on delivery)', ar: 'الدفع عند الاستلام' },
  { value: '60 days net', ar: '60 يوم صافي' },
];

const EMPTY_LINE: QuoteLineItem = { description: '', qty: 1, unit: 'piece', unitPrice: 0 };

export default function SupplierRFQDetailPage() {
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { company } = useAuth();
  const ar = locale === 'ar';

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showLineItems, setShowLineItems] = useState(false);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([{ ...EMPTY_LINE }]);

  const [form, setForm] = useState({
    price: '',
    vatPercent: '15',
    currency: 'SAR',
    deliveryDays: '',
    validUntil: '',
    paymentTerms: '',
    warrantyMonths: '',
    afterSalesSupport: '',
    technicalProposal: '',
    notes: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get(`/rfqs/${id}`).then((res) => setRfq(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const quotaUsed = company?.quotesUsedThisMonth ?? 0;
  const isFree = company?.plan === 'FREE';
  const quotaExceeded = isFree && quotaUsed >= 10;

  // Line items total
  const lineTotal = lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0);
  const vatAmount = lineTotal * ((Number(form.vatPercent) || 0) / 100);
  const grandTotal = lineTotal + vatAmount;

  const updateLineItem = (i: number, field: keyof QuoteLineItem, val: string | number) => {
    setLineItems((prev) => prev.map((li, idx) => idx === i ? { ...li, [field]: val } : li));
  };
  const addLine = () => setLineItems((p) => [...p, { ...EMPTY_LINE }]);
  const removeLine = (i: number) => setLineItems((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const payload: any = {
        rfqId: id,
        price: showLineItems && lineTotal > 0 ? grandTotal : Number(form.price),
        currency: form.currency,
        vatPercent: form.vatPercent ? Number(form.vatPercent) : undefined,
        deliveryDays: form.deliveryDays ? Number(form.deliveryDays) : undefined,
        validUntil: form.validUntil || undefined,
        paymentTerms: form.paymentTerms || undefined,
        warrantyMonths: form.warrantyMonths ? Number(form.warrantyMonths) : undefined,
        afterSalesSupport: form.afterSalesSupport || undefined,
        technicalProposal: form.technicalProposal || undefined,
        notes: form.notes || undefined,
      };
      if (showLineItems && lineItems.some((li) => li.description)) {
        payload.lineItems = lineItems.filter((li) => li.description);
      }
      await api.post('/quotes', payload);
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/dashboard/supplier/quotes`), 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || (ar ? 'فشل إرسال العرض. حاول مجدداً.' : 'Failed to submit quote.'));
    } finally { setSubmitting(false); }
  };

  if (loading) return <DashboardLayout><div className="space-y-4 max-w-3xl"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full" /></div></DashboardLayout>;
  if (!rfq) return <DashboardLayout><div className="text-center py-20 text-slate-500">{ar ? 'لم يتم العثور على الطلب' : 'RFQ not found'}</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard/supplier/rfqs`} className="btn-ghost p-2">
            <ChevronLeft className="h-5 w-5 rtl-mirror" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800 truncate">{rfq.title}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{ar ? `من: ${rfq.buyer?.nameAr ?? '—'}` : `From: ${rfq.buyer?.nameEn ?? '—'}`}</p>
          </div>
          <Badge variant="green" className="ms-auto shrink-0">{ar ? 'مفتوح' : 'Open'}</Badge>
        </div>

        {/* RFQ Details */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-3">{ar ? 'تفاصيل الطلب' : 'Request Details'}</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{rfq.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {rfq.category && <div><p className="text-xs text-slate-400 mb-0.5">{ar ? 'الفئة' : 'Category'}</p><p className="text-sm font-medium text-slate-700 flex items-center gap-1"><Tag className="h-3.5 w-3.5 text-slate-400" />{ar ? rfq.category.nameAr : rfq.category.nameEn}</p></div>}
            {rfq.quantity && <div><p className="text-xs text-slate-400 mb-0.5">{ar ? 'الكمية' : 'Quantity'}</p><p className="text-sm font-medium text-slate-700 flex items-center gap-1"><Package className="h-3.5 w-3.5 text-slate-400" />{rfq.quantity} {rfq.unit}</p></div>}
            {(rfq.budgetMin || rfq.budgetMax) && !rfq.budgetUndisclosed && (
              <div><p className="text-xs text-slate-400 mb-0.5">{ar ? 'الميزانية' : 'Budget'}</p>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-slate-400" />{rfq.budgetMin?.toLocaleString()} – {rfq.budgetMax?.toLocaleString()} SAR</p></div>
            )}
            {rfq.budget && !rfq.budgetMin && !rfq.budgetUndisclosed && <div><p className="text-xs text-slate-400 mb-0.5">{ar ? 'الميزانية' : 'Budget'}</p><p className="text-sm font-medium text-slate-700 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-slate-400" />{rfq.budget.toLocaleString()} SAR</p></div>}
            {rfq.deadline && <div><p className="text-xs text-slate-400 mb-0.5">{ar ? 'آخر موعد' : 'Deadline'}</p><p className="text-sm font-medium text-slate-700 flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400" />{format(new Date(rfq.deadline), 'dd MMM yyyy')}</p></div>}
          </div>
          {/* Badges for special requirements */}
          <div className="flex gap-2 flex-wrap mt-3">
            {rfq.ndaRequired && <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1"><ShieldCheck className="h-3 w-3" />{ar ? 'اتفاقية سرية مطلوبة' : 'NDA Required'}</span>}
            {rfq.siteVisitRequired && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1">{ar ? 'زيارة موقع مطلوبة' : 'Site Visit Required'}</span>}
            {rfq.allowPartialBids === false && <span className="text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded-full px-2.5 py-1">{ar ? 'لا تقبل عروض جزئية' : 'No partial bids'}</span>}
            {rfq.requiredCertifications && rfq.requiredCertifications.length > 0 && rfq.requiredCertifications.map((c) => <span key={c} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">{c}</span>)}
          </div>
        </div>

        {/* Quota warning */}
        {isFree && (
          <div className={`rounded-2xl px-5 py-4 flex items-center justify-between gap-4 ${quotaExceeded ? 'bg-red-50 border border-red-200' : 'bg-brand-50 border border-brand-100'}`}>
            <div className="flex items-center gap-3">
              {quotaExceeded ? <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" /> : <Zap className="h-5 w-5 text-brand-700 shrink-0" />}
              <div>
                <p className={`text-sm font-semibold ${quotaExceeded ? 'text-red-800' : 'text-brand-800'}`}>
                  {quotaExceeded ? (ar ? 'استنفدت حصتك الشهرية' : 'Monthly quota exceeded') : (ar ? `${quotaUsed}/10 عروض مستخدمة هذا الشهر` : `${quotaUsed}/10 quotes used this month`)}
                </p>
                <p className={`text-xs mt-0.5 ${quotaExceeded ? 'text-red-600' : 'text-brand-600'}`}>
                  {quotaExceeded ? (ar ? 'رقّي لـ PRO للحصول على عروض غير محدودة' : 'Upgrade to PRO for unlimited quotes') : (ar ? 'الخطة المجانية: 10 عروض/شهر' : 'Free plan: 10 quotes/month')}
                </p>
              </div>
            </div>
            {quotaExceeded && <Link href={`/${locale}/dashboard/subscription`}><Button size="sm" icon={<Zap className="h-3.5 w-3.5" />}>{ar ? 'ترقية' : 'Upgrade'}</Button></Link>}
          </div>
        )}

        {success && (
          <div className="rounded-2xl bg-green-50 border border-green-200 px-5 py-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">✓</div>
            <div>
              <p className="font-semibold text-green-800">{ar ? 'تم إرسال عرضك بنجاح!' : 'Quote submitted successfully!'}</p>
              <p className="text-xs text-green-600">{ar ? 'جاري التوجيه إلى عروضي...' : 'Redirecting to My Quotes...'}</p>
            </div>
          </div>
        )}

        {/* Quote Form */}
        {!success && !quotaExceeded && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}

            {/* ── Section 1: Pricing ─────────────────────────────── */}
            <div className="card space-y-4">
              <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">{ar ? 'تفاصيل السعر' : 'Pricing Details'}</h2>

              {/* Line items toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showLineItems} onChange={(e) => setShowLineItems(e.target.checked)} className="rounded border-slate-300 text-brand-700" />
                <span className="text-sm text-slate-700 font-medium">{ar ? 'إضافة جدول بنود تفصيلي (BOQ)' : 'Add detailed line items table (BOQ)'}</span>
              </label>

              {showLineItems ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 px-2">
                    <span className="col-span-5">{ar ? 'البند' : 'Description'}</span>
                    <span className="col-span-2 text-center">{ar ? 'الكمية' : 'Qty'}</span>
                    <span className="col-span-2">{ar ? 'الوحدة' : 'Unit'}</span>
                    <span className="col-span-2 text-end">{ar ? 'سعر الوحدة' : 'Unit Price'}</span>
                    <span className="col-span-1" />
                  </div>
                  {lineItems.map((li, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5"><Input value={li.description} onChange={(e) => updateLineItem(i, 'description', e.target.value)} placeholder={ar ? 'وصف البند' : 'Item description'} /></div>
                      <div className="col-span-2"><Input type="number" min="1" value={li.qty} onChange={(e) => updateLineItem(i, 'qty', Number(e.target.value))} /></div>
                      <div className="col-span-2">
                        <select value={li.unit} onChange={(e) => updateLineItem(i, 'unit', e.target.value)} className="input-base text-sm py-2">
                          {['piece', 'kg', 'ton', 'meter', 'liter', 'box', 'set', 'unit', 'hour', 'day'].map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2"><Input type="number" min="0" step="0.01" value={li.unitPrice} onChange={(e) => updateLineItem(i, 'unitPrice', Number(e.target.value))} /></div>
                      <div className="col-span-1 flex justify-center">
                        <button type="button" onClick={() => removeLine(i)} disabled={lineItems.length === 1} className="text-slate-400 hover:text-red-500 disabled:opacity-30"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" size="sm" onClick={addLine} icon={<Plus className="h-4 w-4" />}>{ar ? 'إضافة بند' : 'Add line'}</Button>

                  {/* Totals */}
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm space-y-1 mt-2">
                    <div className="flex justify-between text-slate-600"><span>{ar ? 'المجموع قبل الضريبة' : 'Subtotal'}</span><span>{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span></div>
                    <div className="flex justify-between text-slate-600"><span>{ar ? `ضريبة القيمة المضافة (${form.vatPercent}%)` : `VAT (${form.vatPercent}%)`}</span><span>{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span></div>
                    <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1"><span>{ar ? 'الإجمالي' : 'Total'}</span><span>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-base">{ar ? 'السعر الإجمالي (ريال) *' : 'Total Price (SAR) *'}</label>
                    <Input type="number" min="1" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder={rfq.budgetMin ? String(rfq.budgetMin) : '50000'} required />
                  </div>
                  <div>
                    <label className="label-base">{ar ? 'نسبة ضريبة القيمة المضافة (%)' : 'VAT Percentage (%)'}</label>
                    <Input type="number" min="0" max="100" step="0.1" value={form.vatPercent} onChange={(e) => set('vatPercent', e.target.value)} placeholder="15" />
                    {form.price && form.vatPercent && (
                      <p className="text-xs text-slate-500 mt-1">
                        {ar ? `المجموع مع الضريبة: ${(Number(form.price) * (1 + Number(form.vatPercent) / 100)).toLocaleString()} ريال` : `Total with VAT: ${(Number(form.price) * (1 + Number(form.vatPercent) / 100)).toLocaleString()} SAR`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base">{ar ? 'مدة التوصيل (أيام)' : 'Delivery Days'}</label>
                  <Input type="number" min="1" value={form.deliveryDays} onChange={(e) => set('deliveryDays', e.target.value)} placeholder="14" />
                </div>
                <div>
                  <label className="label-base">{ar ? 'صلاحية العرض حتى' : 'Quote Valid Until'}</label>
                  <Input type="date" value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
            </div>

            {/* ── Section 2: Commercial Terms ────────────────────── */}
            <div className="card space-y-4">
              <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">{ar ? 'الشروط التجارية' : 'Commercial Terms'}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base">{ar ? 'شروط الدفع' : 'Payment Terms'}</label>
                  <select value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} className="input-base">
                    <option value="">{ar ? 'اختر أو اكتب أدناه' : 'Select or type below'}</option>
                    {PAYMENT_TERMS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{ar ? opt.ar : opt.value}</option>)}
                  </select>
                  {!PAYMENT_TERMS_OPTIONS.some((o) => o.value === form.paymentTerms) && form.paymentTerms && (
                    <p className="text-xs text-brand-700 mt-1">{ar ? 'شروط مخصصة محددة' : 'Custom terms specified'}</p>
                  )}
                  {!form.paymentTerms && (
                    <Input className="mt-2" value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} placeholder={ar ? 'أو اكتب شروط الدفع...' : 'Or type custom payment terms...'} />
                  )}
                </div>
                <div>
                  <label className="label-base">{ar ? 'مدة الضمان (أشهر)' : 'Warranty (months)'}</label>
                  <Input type="number" min="0" value={form.warrantyMonths} onChange={(e) => set('warrantyMonths', e.target.value)} placeholder={ar ? 'مثال: 12' : 'e.g. 12'} />
                </div>
              </div>
              <div>
                <label className="label-base">{ar ? 'خدمات ما بعد البيع' : 'After-Sales Support'}</label>
                <textarea value={form.afterSalesSupport} onChange={(e) => set('afterSalesSupport', e.target.value)} rows={2}
                  placeholder={ar ? 'اذكر خدمات الصيانة، الدعم الفني، قطع الغيار...' : 'Describe maintenance services, technical support, spare parts availability...'}
                  className="input-base resize-none" />
              </div>
            </div>

            {/* ── Section 3: Technical Proposal ─────────────────── */}
            <div className="card space-y-4">
              <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-3">{ar ? 'المقترح الفني' : 'Technical Proposal'}</h2>
              <div>
                <label className="label-base">{ar ? 'المقترح الفني التفصيلي' : 'Technical Approach & Methodology'}</label>
                <textarea value={form.technicalProposal} onChange={(e) => set('technicalProposal', e.target.value)} rows={4}
                  placeholder={ar ? 'اشرح المنهجية، المواصفات التقنية، خبرتك في مشاريع مماثلة...' : 'Describe your methodology, technical specifications, experience with similar projects...'}
                  className="input-base resize-none" />
              </div>
              <div>
                <label className="label-base">{ar ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3}
                  placeholder={ar ? 'أي معلومات إضافية تود إضافتها...' : 'Any additional information you want to include...'}
                  className="input-base resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link href={`/${locale}/dashboard/supplier/rfqs`}><Button variant="secondary">{ar ? 'رجوع' : 'Back'}</Button></Link>
              <Button type="submit" loading={submitting} icon={<SendHorizonal className="h-4 w-4" />}
                disabled={!showLineItems ? !form.price : lineItems.every((li) => !li.description)}>
                {ar ? 'إرسال العرض' : 'Submit Quote'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
