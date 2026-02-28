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
import type { RFQ } from '@/types';
import { ChevronLeft, Calendar, Tag, DollarSign, Package, SendHorizonal, Zap, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

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

  const [form, setForm] = useState({
    price: '',
    deliveryDays: '',
    notes: '',
    validUntil: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get(`/rfqs/${id}`).then((res) => {
      setRfq(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/quotes', {
        rfqId: id,
        price: Number(form.price),
        currency: 'SAR',
        deliveryDays: form.deliveryDays ? Number(form.deliveryDays) : undefined,
        notes: form.notes || undefined,
        validUntil: form.validUntil || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/dashboard/supplier/quotes`), 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || (ar ? 'فشل إرسال العرض. حاول مجدداً.' : 'Failed to submit quote.'));
    } finally {
      setSubmitting(false);
    }
  };

  const quotaUsed = company?.quotesUsedThisMonth ?? 0;
  const isFree = company?.plan === 'FREE';
  const quotaExceeded = isFree && quotaUsed >= 3;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-3xl">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!rfq) return (
    <DashboardLayout>
      <div className="text-center py-20 text-slate-500">{ar ? 'لم يتم العثور على الطلب' : 'RFQ not found'}</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard/supplier/rfqs`} className="btn-ghost p-2">
            <ChevronLeft className="h-5 w-5 rtl-mirror" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800 truncate">{rfq.title}</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {ar ? `من: ${rfq.buyer?.nameAr ?? '—'}` : `From: ${rfq.buyer?.nameEn ?? '—'}`}
            </p>
          </div>
          <Badge variant="green" className="ms-auto shrink-0">{ar ? 'مفتوح' : 'Open'}</Badge>
        </div>

        {/* RFQ Details */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-3">{ar ? 'تفاصيل الطلب' : 'Request Details'}</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{rfq.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {rfq.category && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">{ar ? 'الفئة' : 'Category'}</p>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  {ar ? rfq.category.nameAr : rfq.category.nameEn}
                </p>
              </div>
            )}
            {rfq.quantity && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">{ar ? 'الكمية' : 'Quantity'}</p>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 text-slate-400" />
                  {rfq.quantity} {rfq.unit}
                </p>
              </div>
            )}
            {rfq.budget && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">{ar ? 'الميزانية' : 'Budget'}</p>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                  {rfq.budget.toLocaleString()} SAR
                </p>
              </div>
            )}
            {rfq.deadline && (
              <div>
                <p className="text-xs text-slate-400 mb-0.5">{ar ? 'آخر موعد' : 'Deadline'}</p>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {format(new Date(rfq.deadline), 'dd MMM yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quota warning */}
        {isFree && (
          <div className={`rounded-2xl px-5 py-4 flex items-center justify-between gap-4 ${
            quotaExceeded ? 'bg-red-50 border border-red-200' : 'bg-brand-50 border border-brand-100'
          }`}>
            <div className="flex items-center gap-3">
              {quotaExceeded
                ? <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                : <Zap className="h-5 w-5 text-brand-700 shrink-0" />}
              <div>
                <p className={`text-sm font-semibold ${quotaExceeded ? 'text-red-800' : 'text-brand-800'}`}>
                  {quotaExceeded
                    ? (ar ? 'استنفدت حصتك الشهرية' : 'Monthly quota exceeded')
                    : (ar ? `${quotaUsed}/3 عروض مستخدمة هذا الشهر` : `${quotaUsed}/3 quotes used this month`)}
                </p>
                <p className={`text-xs mt-0.5 ${quotaExceeded ? 'text-red-600' : 'text-brand-600'}`}>
                  {quotaExceeded
                    ? (ar ? 'رقّي لـ PRO للحصول على عروض غير محدودة' : 'Upgrade to PRO for unlimited quotes')
                    : (ar ? 'الخطة المجانية: 3 عروض/شهر' : 'Free plan: 3 quotes/month')}
                </p>
              </div>
            </div>
            {quotaExceeded && (
              <Link href={`/${locale}/dashboard/subscription`}>
                <Button size="sm" icon={<Zap className="h-3.5 w-3.5" />}>{ar ? 'ترقية' : 'Upgrade'}</Button>
              </Link>
            )}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="rounded-2xl bg-green-50 border border-green-200 px-5 py-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">✓</div>
            <div>
              <p className="font-semibold text-green-800">{ar ? 'تم إرسال عرضك بنجاح!' : 'Quote submitted successfully!'}</p>
              <p className="text-xs text-green-600">{ar ? 'جاري التوجيه إلى عروضي...' : 'Redirecting to My Quotes...'}</p>
            </div>
          </div>
        )}

        {/* Submit Quote Form */}
        {!success && !quotaExceeded && (
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-5">{ar ? 'تقديم عرض سعر' : 'Submit Your Quote'}</h2>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base">{ar ? 'السعر الإجمالي (ريال) *' : 'Total Price (SAR) *'}</label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder={rfq.budget ? String(rfq.budget) : '50000'}
                    required
                  />
                </div>
                <div>
                  <label className="label-base">{ar ? 'مدة التوصيل (أيام)' : 'Delivery Days'}</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.deliveryDays}
                    onChange={(e) => set('deliveryDays', e.target.value)}
                    placeholder="14"
                  />
                </div>
              </div>

              <div>
                <label className="label-base">{ar ? 'ملاحظات / تفاصيل العرض' : 'Notes / Offer Details'}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={4}
                  placeholder={ar
                    ? 'اذكر مواصفات المنتج، شروط الدفع، خدمات ما بعد البيع...'
                    : 'Include product specs, payment terms, after-sales services...'}
                  className="input-base resize-none"
                />
              </div>

              <div>
                <label className="label-base">{ar ? 'صلاحية العرض حتى' : 'Valid Until'}</label>
                <Input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => set('validUntil', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link href={`/${locale}/dashboard/supplier/rfqs`}>
                  <Button variant="secondary">{ar ? 'رجوع' : 'Back'}</Button>
                </Link>
                <Button
                  type="submit"
                  loading={submitting}
                  icon={<SendHorizonal className="h-4 w-4" />}
                  disabled={!form.price}
                >
                  {ar ? 'إرسال العرض' : 'Submit Quote'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
