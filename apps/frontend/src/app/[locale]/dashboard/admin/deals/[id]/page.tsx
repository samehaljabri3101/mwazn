'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft, Briefcase, Building2, FileText, Star,
  CheckCircle2, XCircle, Clock, Loader2, Banknote,
  Calendar, MessageSquare, ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DealDetail {
  id: string;
  status: string;
  totalAmount: string | number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  quote?: {
    id: string;
    price: number;
    currency?: string;
    deliveryDays?: number;
    notes?: string;
    rfq?: { id: string; title: string; status: string };
    attachments?: { id: string; fileUrl: string; fileName?: string }[];
  };
  buyer?: { id: string; nameAr: string; nameEn: string; city?: string };
  supplier?: { id: string; nameAr: string; nameEn: string; city?: string };
  ratings?: {
    id: string;
    score: number;
    comment?: string;
    createdAt: string;
    rater?: { nameAr: string; nameEn: string };
    rated?: { nameAr: string; nameEn: string };
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string; labelEn: string; labelAr: string }> = {
  AWARDED:     { icon: <CheckCircle2 className="h-4 w-4" />, bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    labelEn: 'Awarded',     labelAr: 'مُرسى'       },
  IN_PROGRESS: { icon: <Loader2 className="h-4 w-4" />,      bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   labelEn: 'In Progress', labelAr: 'قيد التنفيذ' },
  DELIVERED:   { icon: <CheckCircle2 className="h-4 w-4" />, bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    labelEn: 'Delivered',   labelAr: 'تم التسليم'  },
  COMPLETED:   { icon: <CheckCircle2 className="h-4 w-4" />, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', labelEn: 'Completed',   labelAr: 'مكتملة'      },
  CANCELLED:   { icon: <XCircle className="h-4 w-4" />,      bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     labelEn: 'Cancelled',   labelAr: 'ملغاة'       },
};

const DEAL_STAGES = ['AWARDED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'];

function fmtCurrency(amount: string | number, currency = 'SAR') {
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency, minimumFractionDigits: 0 }).format(Number(amount));
}

function fmtDate(d?: string, locale = 'en') {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDealDetailPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;

  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/deals/${params.id}`);
        setDeal(res.data?.data ?? res.data);
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [params.id]);

  const meta = deal ? (STATUS_META[deal.status] ?? STATUS_META.AWARDED) : null;
  const stageIdx = deal ? DEAL_STAGES.indexOf(deal.status) : -1;
  const value = deal ? fmtCurrency(deal.totalAmount, deal.currency) : '—';

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`${base}/admin/deals`} className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 truncate">
                {loading ? (ar ? 'جارٍ التحميل...' : 'Loading…')
                  : deal ? (deal.quote?.rfq?.title ?? (ar ? 'تفاصيل الصفقة' : 'Deal Detail'))
                  : (ar ? 'الصفقة غير موجودة' : 'Deal not found')}
              </h1>
              <p className="text-xs text-slate-400">{ar ? 'تفاصيل الصفقة' : 'Deal detail'}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : notFound || !deal ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <Briefcase className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'الصفقة غير موجودة' : 'Deal not found'}</p>
            <Link href={`${base}/admin/deals`} className="mt-3 text-xs text-brand-600 hover:underline">
              {ar ? '← العودة للقائمة' : '← Back to deals'}
            </Link>
          </div>
        ) : (
          <>
            {/* ── Status + Value banner ─────────────────────────────────────── */}
            <div className={`card border-2 ${meta!.border} ${meta!.bg}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta!.bg} ${meta!.text} border ${meta!.border}`}>
                    {meta!.icon}
                  </div>
                  <div>
                    <p className={`text-base font-bold ${meta!.text}`}>
                      {ar ? meta!.labelAr : meta!.labelEn}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ar ? 'أُنشئت في' : 'Created'} {fmtDate(deal.createdAt, locale)}
                    </p>
                  </div>
                </div>

                {/* Deal value */}
                <div className="flex items-center gap-2 shrink-0 rounded-xl bg-white/80 border border-slate-200 px-4 py-3">
                  <Banknote className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">
                      {ar ? 'قيمة الصفقة' : 'Deal Value'}
                    </p>
                    <p className="text-lg font-bold text-emerald-700">{value}</p>
                  </div>
                </div>
              </div>

              {/* Progress stages */}
              <div className="mt-5 pt-4 border-t border-current/10">
                <div className="flex items-center gap-0">
                  {DEAL_STAGES.map((stage, idx) => {
                    const isCompleted = stageIdx > idx;
                    const isCurrent = stageIdx === idx;
                    const isCancelled = deal.status === 'CANCELLED';
                    return (
                      <div key={stage} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div className={[
                            'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                            isCancelled ? 'bg-red-100 text-red-500' :
                            isCompleted || isCurrent ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400',
                          ].join(' ')}>
                            {isCompleted && !isCancelled ? '✓' : idx + 1}
                          </div>
                          <p className={`text-[9px] mt-1 font-medium text-center whitespace-nowrap ${
                            isCurrent ? (ar ? meta!.text : meta!.text) : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                          }`}>
                            {ar ? STATUS_META[stage]?.labelAr : STATUS_META[stage]?.labelEn}
                          </p>
                        </div>
                        {idx < DEAL_STAGES.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 ${isCompleted && !isCancelled ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Parties ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Buyer */}
              <Link href={deal.buyer?.id ? `${base}/admin/companies/${deal.buyer.id}` : '#'} className="card group hover:shadow-md transition-all">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{ar ? 'المشتري' : 'Buyer'}</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 text-sm font-bold">
                    {(ar ? deal.buyer?.nameAr : deal.buyer?.nameEn)?.charAt(0) ?? 'B'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate group-hover:text-brand-700 transition-colors">
                      {ar ? deal.buyer?.nameAr : deal.buyer?.nameEn}
                    </p>
                    {deal.buyer?.city && <p className="text-xs text-slate-400">{deal.buyer.city}</p>}
                  </div>
                </div>
                <ChevronRight className="absolute top-4 end-4 h-4 w-4 text-slate-300 group-hover:text-brand-400 transition-colors" />
              </Link>

              {/* Supplier */}
              <Link href={deal.supplier?.id ? `${base}/admin/companies/${deal.supplier.id}` : '#'} className="card group hover:shadow-md transition-all relative">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{ar ? 'المورّد' : 'Supplier'}</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 text-sm font-bold">
                    {(ar ? deal.supplier?.nameAr : deal.supplier?.nameEn)?.charAt(0) ?? 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate group-hover:text-brand-700 transition-colors">
                      {ar ? deal.supplier?.nameAr : deal.supplier?.nameEn}
                    </p>
                    {deal.supplier?.city && <p className="text-xs text-slate-400">{deal.supplier.city}</p>}
                  </div>
                </div>
                <ChevronRight className="absolute top-4 end-4 h-4 w-4 text-slate-300 group-hover:text-brand-400 transition-colors" />
              </Link>
            </div>

            {/* ── RFQ context ──────────────────────────────────────────────── */}
            {deal.quote?.rfq && (
              <div className="card">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">{ar ? 'طلب العرض المرتبط' : 'Linked RFQ'}</p>
                <Link
                  href={`${base}/admin/rfqs/${deal.quote.rfq.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate group-hover:text-brand-700 transition-colors">
                      {deal.quote.rfq.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                        deal.quote.rfq.status === 'AWARDED' ? 'bg-blue-100 text-blue-700' :
                        deal.quote.rfq.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {deal.quote.rfq.status}
                      </span>
                      {deal.quote.price && (
                        <span className="text-xs text-slate-500">
                          {ar ? 'قيمة العرض' : 'Quote price'}: {fmtCurrency(deal.quote.price, deal.quote.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-400 shrink-0 transition-colors" />
                </Link>

                {deal.quote.deliveryDays && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {ar ? `مدة التسليم: ${deal.quote.deliveryDays} يوم` : `Delivery: ${deal.quote.deliveryDays} days`}
                  </div>
                )}
              </div>
            )}

            {/* ── Notes ────────────────────────────────────────────────────── */}
            {deal.notes && (
              <div className="card">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{ar ? 'ملاحظات' : 'Notes'}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{deal.notes}</p>
              </div>
            )}

            {/* ── Ratings ──────────────────────────────────────────────────── */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-slate-800">{ar ? 'التقييمات' : 'Ratings'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(deal.ratings?.length ?? 0) === 0
                      ? (ar ? 'لا توجد تقييمات بعد' : 'No ratings yet')
                      : (ar ? `${deal.ratings!.length} تقييم` : `${deal.ratings!.length} rating${deal.ratings!.length > 1 ? 's' : ''}`)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-100 px-3 py-1.5">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-amber-700">{deal.ratings?.length ?? 0}/2</span>
                </div>
              </div>

              {(deal.ratings?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400">
                    {deal.status === 'COMPLETED'
                      ? (ar ? 'لم يُقدَّم أي تقييم بعد' : 'No ratings submitted yet')
                      : (ar ? 'التقييمات متاحة فقط للصفقات المكتملة' : 'Ratings available after deal completion')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deal.ratings!.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">
                        {(ar ? r.rater?.nameAr : r.rater?.nameEn)?.charAt(0) ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-700">{ar ? r.rater?.nameAr : r.rater?.nameEn}</p>
                          <span className="text-slate-300 text-xs">→</span>
                          <p className="text-xs text-slate-500">{ar ? r.rated?.nameAr : r.rated?.nameEn}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`h-3 w-3 ${s <= r.score ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                          ))}
                          <span className="text-xs font-bold text-amber-600 ms-1">{r.score}/5</span>
                        </div>
                        {r.comment && <p className="text-xs text-slate-500 mt-1 italic">&quot;{r.comment}&quot;</p>}
                      </div>
                      <p className="text-[10px] text-slate-400 shrink-0">
                        {new Date(r.createdAt).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </DashboardLayout>
  );
}
