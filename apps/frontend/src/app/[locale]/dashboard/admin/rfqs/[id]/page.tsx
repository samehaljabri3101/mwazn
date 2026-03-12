'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft, FileText, MessageSquare, CheckCircle2, XCircle, Clock,
  Building2, Calendar, Banknote, MapPin, Tag, Users,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Quote {
  id: string;
  price: number;
  currency?: string;
  deliveryDays?: number;
  status: string;
  notes?: string;
  createdAt: string;
  supplier?: { id: string; nameAr: string; nameEn: string; city?: string; plan?: string };
}

interface RFQDetail {
  id: string;
  title: string;
  description?: string;
  status: string;
  budget?: number;
  budgetMin?: number;
  budgetMax?: number;
  budgetUndisclosed?: boolean;
  currency?: string;
  deadline?: string;
  createdAt: string;
  projectType?: string;
  quantity?: number;
  unit?: string;
  category?: { nameAr: string; nameEn: string };
  buyer?: { id: string; nameAr: string; nameEn: string; city?: string };
  quotes?: Quote[];
  _count?: { quotes: number };
}

// ─── Quote status badge ───────────────────────────────────────────────────────

const QUOTE_STATUS_META: Record<string, { bg: string; text: string; labelEn: string; labelAr: string }> = {
  PENDING:   { bg: 'bg-amber-100',   text: 'text-amber-700',   labelEn: 'Pending',   labelAr: 'بانتظار' },
  ACCEPTED:  { bg: 'bg-emerald-100', text: 'text-emerald-700', labelEn: 'Accepted',  labelAr: 'مقبول'  },
  REJECTED:  { bg: 'bg-red-100',     text: 'text-red-600',     labelEn: 'Rejected',  labelAr: 'مرفوض'  },
  WITHDRAWN: { bg: 'bg-slate-100',   text: 'text-slate-500',   labelEn: 'Withdrawn', labelAr: 'منسحب'  },
};

function QuoteStatusBadge({ status, ar }: { status: string; ar: boolean }) {
  const meta = QUOTE_STATUS_META[status] ?? QUOTE_STATUS_META.PENDING;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${meta.bg} ${meta.text}`}>
      {ar ? meta.labelAr : meta.labelEn}
    </span>
  );
}

// ─── Info field ───────────────────────────────────────────────────────────────

function InfoField({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRFQDetailPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;

  const [rfq, setRfq] = useState<RFQDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchRfq = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/rfqs/${params.id}`);
        setRfq(res.data?.data ?? res.data);
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    };
    fetchRfq();
  }, [params.id]);

  const fmtBudget = (r: RFQDetail) => {
    if (r.budgetUndisclosed) return ar ? 'غير محدد' : 'Undisclosed';
    const c = r.currency ?? 'SAR';
    if (r.budgetMin && r.budgetMax) return `${r.budgetMin.toLocaleString()}–${r.budgetMax.toLocaleString()} ${c}`;
    if (r.budget) return `${r.budget.toLocaleString()} ${c}`;
    return '—';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`${base}/admin/rfqs`} className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {loading ? (ar ? 'جارٍ التحميل...' : 'Loading…') : (rfq?.title ?? (ar ? 'طلب عرض سعر' : 'RFQ Detail'))}
            </h1>
            <p className="text-sm text-slate-400">{ar ? 'تفاصيل طلب العرض' : 'Request for Quotation'}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : notFound || !rfq ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <FileText className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'الطلب غير موجود' : 'RFQ not found'}</p>
            <Link href={`${base}/admin/rfqs`} className="mt-3 text-xs text-brand-600 hover:underline">
              {ar ? 'العودة للقائمة' : 'Back to RFQ list'}
            </Link>
          </div>
        ) : (
          <>
            {/* RFQ details card */}
            <div className="card">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{rfq.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ar ? 'أُنشئ في' : 'Created'} {new Date(rfq.createdAt).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                  rfq.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' :
                  rfq.status === 'AWARDED' ? 'bg-blue-100 text-blue-700' :
                  rfq.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {rfq.status}
                </span>
              </div>

              {rfq.description && (
                <p className="text-sm text-slate-600 leading-relaxed mb-5 pb-5 border-b border-slate-100">
                  {rfq.description}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <InfoField
                  label={ar ? 'المشتري' : 'Buyer'}
                  value={
                    <Link href={`${base}/admin/companies/${rfq.buyer?.id}`} className="text-brand-600 hover:underline">
                      {ar ? rfq.buyer?.nameAr : rfq.buyer?.nameEn}
                    </Link>
                  }
                />
                {rfq.buyer?.city && <InfoField label={ar ? 'المدينة' : 'City'} value={rfq.buyer.city} />}
                <InfoField label={ar ? 'الفئة' : 'Category'} value={ar ? rfq.category?.nameAr : rfq.category?.nameEn} />
                <InfoField label={ar ? 'الميزانية' : 'Budget'} value={fmtBudget(rfq)} />
                {rfq.deadline && (
                  <InfoField
                    label={ar ? 'الموعد النهائي' : 'Deadline'}
                    value={new Date(rfq.deadline).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                  />
                )}
                {rfq.projectType && <InfoField label={ar ? 'نوع المشروع' : 'Project Type'} value={rfq.projectType} />}
                {rfq.quantity && <InfoField label={ar ? 'الكمية' : 'Quantity'} value={`${rfq.quantity} ${rfq.unit ?? ''}`} />}
              </div>
            </div>

            {/* Quotes */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {ar ? 'عروض الأسعار المقدّمة' : 'Submitted Quotes'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(rfq.quotes?.length ?? 0) > 0
                      ? (ar ? `${rfq.quotes!.length} عرض مقدّم` : `${rfq.quotes!.length} quote${rfq.quotes!.length > 1 ? 's' : ''} submitted`)
                      : (ar ? 'لم يُقدَّم أي عرض بعد' : 'No quotes submitted yet')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-sm font-bold text-slate-700">{rfq.quotes?.length ?? 0}</span>
                </div>
              </div>

              {!rfq.quotes || rfq.quotes.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400">{ar ? 'لا توجد عروض لهذا الطلب' : 'No quotes for this RFQ yet'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rfq.quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-center gap-4 rounded-xl border border-slate-100 px-4 py-3 hover:border-slate-200 hover:bg-slate-50/50 transition-all"
                    >
                      {/* Supplier */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-xs font-bold">
                        {(ar ? quote.supplier?.nameAr : quote.supplier?.nameEn)?.charAt(0).toUpperCase() ?? 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`${base}/admin/companies/${quote.supplier?.id}`}
                          className="text-sm font-semibold text-slate-800 hover:text-brand-700 transition-colors truncate block"
                        >
                          {ar ? quote.supplier?.nameAr : quote.supplier?.nameEn}
                        </Link>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(quote.createdAt).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {quote.deliveryDays && ` · ${quote.deliveryDays} ${ar ? 'يوم توصيل' : 'd delivery'}`}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-end shrink-0">
                        <p className="text-sm font-bold text-slate-900">
                          {quote.price.toLocaleString()} {quote.currency ?? 'SAR'}
                        </p>
                        <QuoteStatusBadge status={quote.status} ar={ar} />
                      </div>
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
