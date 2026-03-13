'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft, FileText, MessageSquare, CheckCircle2, XCircle, Clock,
  Building2, Shield, Flag, Trash2, RotateCcw, Truck, Package,
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

interface Deal {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  trackingNumber?: string | null;
  carrierName?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

interface RFQDetail {
  id: string;
  title: string;
  description?: string;
  status: string;
  moderationStatus?: string;
  moderationSource?: string;
  moderationReason?: string;
  moderatedAt?: string;
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

// ─── Badges ───────────────────────────────────────────────────────────────────

const RFQ_STATUS_META: Record<string, { bg: string; text: string; labelEn: string; labelAr: string }> = {
  OPEN:            { bg: 'bg-emerald-100', text: 'text-emerald-700', labelEn: 'Open',            labelAr: 'مفتوح'       },
  QUOTES_RECEIVED: { bg: 'bg-blue-100',    text: 'text-blue-700',    labelEn: 'Quotes Received',  labelAr: 'عروض واردة'  },
  ACCEPTED:        { bg: 'bg-violet-100',  text: 'text-violet-700',  labelEn: 'Accepted',         labelAr: 'مقبول'       },
  AWARDED:         { bg: 'bg-indigo-100',  text: 'text-indigo-700',  labelEn: 'Awarded',          labelAr: 'مُرسى'       },
  CANCELLED:       { bg: 'bg-red-100',     text: 'text-red-600',     labelEn: 'Cancelled',        labelAr: 'ملغى'        },
  CLOSED:          { bg: 'bg-slate-100',   text: 'text-slate-500',   labelEn: 'Closed',           labelAr: 'مغلق'        },
};

const MOD_STATUS_META: Record<string, { bg: string; text: string; labelEn: string; labelAr: string }> = {
  ACTIVE:   { bg: 'bg-emerald-100', text: 'text-emerald-700', labelEn: 'Active',   labelAr: 'نشط'    },
  FLAGGED:  { bg: 'bg-amber-100',   text: 'text-amber-700',   labelEn: 'Flagged',  labelAr: 'مُعلَّم' },
  REMOVED:  { bg: 'bg-red-100',     text: 'text-red-700',     labelEn: 'Removed',  labelAr: 'محذوف'  },
  REJECTED: { bg: 'bg-rose-100',    text: 'text-rose-700',    labelEn: 'Rejected', labelAr: 'مرفوض'  },
};

const DEAL_STATUS_META: Record<string, { bg: string; text: string; labelEn: string; labelAr: string }> = {
  AWARDED:     { bg: 'bg-amber-100',   text: 'text-amber-700',   labelEn: 'Awarded',      labelAr: 'مُرسى'       },
  IN_PROGRESS: { bg: 'bg-blue-100',    text: 'text-blue-700',    labelEn: 'In Progress',  labelAr: 'قيد التنفيذ' },
  DELIVERED:   { bg: 'bg-violet-100',  text: 'text-violet-700',  labelEn: 'Delivered',    labelAr: 'تم الشحن'    },
  COMPLETED:   { bg: 'bg-emerald-100', text: 'text-emerald-700', labelEn: 'Completed',    labelAr: 'مكتملة'      },
  CANCELLED:   { bg: 'bg-red-100',     text: 'text-red-600',     labelEn: 'Cancelled',    labelAr: 'ملغاة'       },
};

const QUOTE_STATUS_META: Record<string, { bg: string; text: string; labelEn: string; labelAr: string }> = {
  PENDING:   { bg: 'bg-amber-100',   text: 'text-amber-700',   labelEn: 'Pending',   labelAr: 'بانتظار' },
  ACCEPTED:  { bg: 'bg-emerald-100', text: 'text-emerald-700', labelEn: 'Accepted',  labelAr: 'مقبول'  },
  REJECTED:  { bg: 'bg-red-100',     text: 'text-red-600',     labelEn: 'Rejected',  labelAr: 'مرفوض'  },
  WITHDRAWN: { bg: 'bg-slate-100',   text: 'text-slate-500',   labelEn: 'Withdrawn', labelAr: 'منسحب'  },
};

function StatusBadge({ status, meta, ar }: { status: string; meta: Record<string, { bg: string; text: string; labelEn: string; labelAr: string }>; ar: boolean }) {
  const m = meta[status] ?? { bg: 'bg-slate-100', text: 'text-slate-500', labelEn: status, labelAr: status };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${m.bg} ${m.text}`}>
      {ar ? m.labelAr : m.labelEn}
    </span>
  );
}

function InfoField({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRFQDetailPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;

  const [rfq, setRfq] = useState<RFQDetail | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [acceptedSupplier, setAcceptedSupplier] = useState<Quote['supplier'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removeReason, setRemoveReason] = useState('');
  const [confirmFlag, setConfirmFlag] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const fetchRfq = useCallback(async () => {
    setLoading(true);
    try {
      const [rfqRes, dealsRes] = await Promise.allSettled([
        api.get(`/rfqs/${params.id}`),
        api.get('/deals', { params: { limit: 100 } }),
      ]);

      if (rfqRes.status === 'fulfilled') {
        const data: RFQDetail = rfqRes.value.data?.data ?? rfqRes.value.data;
        setRfq(data);

        // Find accepted quote
        const accepted = data.quotes?.find((q) => q.status === 'ACCEPTED');
        if (accepted) setAcceptedSupplier(accepted.supplier ?? null);
      } else {
        setNotFound(true);
      }

      // Find deal linked to this RFQ
      if (dealsRes.status === 'fulfilled') {
        const items: (Deal & { quote?: { rfqId?: string } })[] = dealsRes.value.data?.data?.items ?? dealsRes.value.data?.data ?? [];
        const linked = items.find((d) => d.quote?.rfqId === params.id || (d as any).rfqId === params.id);
        if (linked) setDeal(linked);
      }
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => { fetchRfq(); }, [fetchRfq]);

  const doModerationAction = async (action: 'remove' | 'restore' | 'flag', reason?: string) => {
    setActionLoading(action);
    try {
      await api.patch(`/admin/rfqs/${params.id}/${action}`, reason ? { reason } : {});
      await fetchRfq();
    } catch { /* silent */ }
    setActionLoading(null);
    setConfirmRemove(false);
    setRemoveReason('');
    setConfirmFlag(false);
    setFlagReason('');
  };

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

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
            <p className="text-sm text-slate-400">{ar ? 'تفاصيل طلب العرض — عرض المشرف' : 'Request for Quotation — Admin View'}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
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
                      {ar ? 'أُنشئ في' : 'Created'} {fmtDate(rfq.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={rfq.status} meta={RFQ_STATUS_META} ar={ar} />
                  {rfq.moderationStatus && rfq.moderationStatus !== 'ACTIVE' && (
                    <StatusBadge status={rfq.moderationStatus} meta={MOD_STATUS_META} ar={ar} />
                  )}
                </div>
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
                    value={fmtDate(rfq.deadline)}
                  />
                )}
                {rfq.projectType && <InfoField label={ar ? 'نوع المشروع' : 'Project Type'} value={rfq.projectType} />}
                {rfq.quantity && <InfoField label={ar ? 'الكمية' : 'Quantity'} value={`${rfq.quantity} ${rfq.unit ?? ''}`} />}
              </div>
            </div>

            {/* Moderation details + admin actions */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-slate-500" />
                <h3 className="font-semibold text-slate-800">{ar ? 'حالة الإشراف والإجراءات' : 'Moderation Status & Actions'}</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mb-5">
                <InfoField
                  label={ar ? 'حالة الإشراف' : 'Moderation Status'}
                  value={(() => {
                    const m = MOD_STATUS_META[rfq.moderationStatus ?? 'ACTIVE'] ?? MOD_STATUS_META.ACTIVE;
                    return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.bg} ${m.text}`}>{ar ? m.labelAr : m.labelEn}</span>;
                  })()}
                />
                {rfq.moderationSource && <InfoField label={ar ? 'المصدر' : 'Source'} value={rfq.moderationSource} />}
                {rfq.moderationReason && <InfoField label={ar ? 'السبب' : 'Reason'} value={rfq.moderationReason} />}
                {rfq.moderatedAt && <InfoField label={ar ? 'تاريخ الإشراف' : 'Moderated At'} value={fmtDate(rfq.moderatedAt)} />}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {rfq.moderationStatus && rfq.moderationStatus !== 'ACTIVE' && (
                  <button
                    onClick={() => doModerationAction('restore')}
                    disabled={!!actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {ar ? 'استعادة' : 'Restore'}
                  </button>
                )}
                {(!rfq.moderationStatus || rfq.moderationStatus === 'ACTIVE') && !confirmFlag && (
                  <button
                    onClick={() => setConfirmFlag(true)}
                    disabled={!!actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                  >
                    <Flag className="h-4 w-4" />
                    {ar ? 'تعليم للمراجعة' : 'Flag for Review'}
                  </button>
                )}
                {confirmFlag && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      placeholder={ar ? 'سبب التعليم (اختياري)...' : 'Reason for flagging (optional)…'}
                      className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    <button
                      onClick={() => doModerationAction('flag', flagReason || undefined)}
                      disabled={!!actionLoading}
                      className="rounded-xl bg-amber-500 text-white px-3 py-2 text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                    >
                      {ar ? 'تأكيد التعليم' : 'Confirm Flag'}
                    </button>
                    <button onClick={() => setConfirmFlag(false)} className="text-sm text-slate-500">
                      {ar ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                )}
                {rfq.moderationStatus !== 'REMOVED' && !confirmRemove && (
                  <button
                    onClick={() => setConfirmRemove(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    {ar ? 'حذف من المنصة' : 'Remove from Platform'}
                  </button>
                )}
                {confirmRemove && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={removeReason}
                      onChange={(e) => setRemoveReason(e.target.value)}
                      placeholder={ar ? 'سبب الحذف...' : 'Reason for removal…'}
                      className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                    <button
                      onClick={() => doModerationAction('remove', removeReason || undefined)}
                      disabled={!!actionLoading}
                      className="rounded-xl bg-red-600 text-white px-3 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {ar ? 'تأكيد' : 'Confirm'}
                    </button>
                    <button onClick={() => setConfirmRemove(false)} className="text-sm text-slate-500">
                      {ar ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Accepted supplier + fulfillment */}
            {(acceptedSupplier || deal) && (
              <div className="card border border-emerald-100 bg-emerald-50/20">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-semibold text-slate-800">{ar ? 'المورد المقبول والتنفيذ' : 'Accepted Supplier & Fulfillment'}</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                  {acceptedSupplier && (
                    <InfoField
                      label={ar ? 'المورد المقبول' : 'Accepted Supplier'}
                      value={
                        <Link href={`${base}/admin/companies/${acceptedSupplier.id}`} className="text-brand-600 hover:underline">
                          {ar ? acceptedSupplier.nameAr : acceptedSupplier.nameEn}
                        </Link>
                      }
                    />
                  )}
                  {deal && (
                    <>
                      <InfoField
                        label={ar ? 'حالة الصفقة' : 'Deal Status'}
                        value={<StatusBadge status={deal.status} meta={DEAL_STATUS_META} ar={ar} />}
                      />
                      <InfoField
                        label={ar ? 'قيمة الصفقة' : 'Deal Value'}
                        value={`${Number(deal.totalAmount).toLocaleString()} ${deal.currency}`}
                      />
                      {deal.trackingNumber && <InfoField label={ar ? 'رقم الشحن' : 'Tracking #'} value={deal.trackingNumber} />}
                      {deal.carrierName && <InfoField label={ar ? 'شركة الشحن' : 'Carrier'} value={deal.carrierName} />}
                      {deal.shippedAt && <InfoField label={ar ? 'تاريخ الشحن' : 'Shipped At'} value={fmtDate(deal.shippedAt)} />}
                      {deal.deliveredAt && <InfoField label={ar ? 'تاريخ التسليم' : 'Delivered At'} value={fmtDate(deal.deliveredAt)} />}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Quotes */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {ar ? 'عروض الأسعار المقدّمة' : 'Submitted Quotes'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(rfq.quotes?.length ?? 0) > 0
                      ? (ar ? `${rfq.quotes!.length} عرض مقدّم` : `${rfq.quotes!.length} quote${rfq.quotes!.length !== 1 ? 's' : ''} submitted`)
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
                      className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-all ${
                        quote.status === 'ACCEPTED'
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                      }`}
                    >
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
                      <div className="text-end shrink-0">
                        <p className="text-sm font-bold text-slate-900">
                          {Number(quote.price).toLocaleString()} {quote.currency ?? 'SAR'}
                        </p>
                        <StatusBadge status={quote.status} meta={QUOTE_STATUS_META} ar={ar} />
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
