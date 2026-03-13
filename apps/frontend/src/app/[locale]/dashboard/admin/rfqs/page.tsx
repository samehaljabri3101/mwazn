'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  FileText, Search, ChevronRight, Clock, CheckCircle2,
  XCircle, Package, MessageSquare, ArrowLeft, Calendar, Banknote,
  Flag, Trash2, RotateCcw,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RFQItem {
  id: string;
  title: string;
  status: string;
  moderationStatus?: string;
  budget?: number;
  budgetMin?: number;
  budgetMax?: number;
  budgetUndisclosed?: boolean;
  currency?: string;
  deadline?: string;
  createdAt: string;
  category?: { nameAr: string; nameEn: string };
  buyer?: { nameAr: string; nameEn: string; city?: string };
  _count?: { quotes: number };
}

const MOD_META: Record<string, { bg: string; text: string }> = {
  ACTIVE:   { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  FLAGGED:  { bg: 'bg-amber-100',   text: 'text-amber-700' },
  REMOVED:  { bg: 'bg-red-100',     text: 'text-red-700' },
  REJECTED: { bg: 'bg-rose-100',    text: 'text-rose-700' },
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { icon: React.ReactNode; bg: string; text: string; labelEn: string; labelAr: string }> = {
  OPEN:      { icon: <Clock className="h-3 w-3" />,         bg: 'bg-emerald-100', text: 'text-emerald-700', labelEn: 'Open',      labelAr: 'مفتوح'    },
  CLOSED:    { icon: <XCircle className="h-3 w-3" />,       bg: 'bg-slate-100',   text: 'text-slate-500',  labelEn: 'Closed',    labelAr: 'مغلق'     },
  AWARDED:   { icon: <CheckCircle2 className="h-3 w-3" />,  bg: 'bg-blue-100',    text: 'text-blue-700',   labelEn: 'Awarded',   labelAr: 'مُرسى'    },
  CANCELLED: { icon: <XCircle className="h-3 w-3" />,       bg: 'bg-red-100',     text: 'text-red-600',    labelEn: 'Cancelled', labelAr: 'ملغى'     },
};

function StatusBadge({ status, ar }: { status: string; ar: boolean }) {
  const meta = STATUS_META[status] ?? STATUS_META.CLOSED;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.bg} ${meta.text}`}>
      {meta.icon}
      {ar ? meta.labelAr : meta.labelEn}
    </span>
  );
}

function fmtBudget(item: RFQItem, ar: boolean) {
  if (item.budgetUndisclosed) return ar ? 'السعر غير محدد' : 'Undisclosed';
  const curr = item.currency ?? 'SAR';
  if (item.budgetMin && item.budgetMax) return `${item.budgetMin.toLocaleString()}–${item.budgetMax.toLocaleString()} ${curr}`;
  if (item.budget) return `${item.budget.toLocaleString()} ${curr}`;
  return '—';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRFQsPage() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;

  const [rfqs, setRfqs] = useState<RFQItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modFilter, setModFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modActionLoading, setModActionLoading] = useState<string | null>(null);
  const limit = 30;

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/rfqs', {
        params: {
          page, limit,
          ...(search ? { search } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(modFilter ? { moderationStatus: modFilter } : {}),
        },
      });
      const data = res.data?.data ?? res.data;
      setRfqs(data?.items ?? data ?? []);
      setTotal(data?.meta?.total ?? data?.total ?? 0);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [page, search, statusFilter, modFilter]);

  useEffect(() => { fetchRfqs(); }, [fetchRfqs]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter, modFilter]);

  const moderateRFQ = async (id: string, action: 'remove' | 'restore' | 'flag', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setModActionLoading(`${id}-${action}`);
    try {
      await api.patch(`/admin/rfqs/${id}/${action}`, {});
      await fetchRfqs();
    } catch { /* silent */ }
    setModActionLoading(null);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href={`${base}/admin`} className="text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">
                {ar ? 'طلبات الأسعار' : 'Platform RFQs'}
              </h1>
            </div>
            <p className="text-sm text-slate-500 ps-6">
              {ar ? `${total} طلب عرض سعر على المنصة` : `${total} requests for quotation across the platform`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? 'بحث بعنوان الطلب...' : 'Search by title...'}
              className="input-base ps-9 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base w-40"
          >
            <option value="">{ar ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="OPEN">{ar ? 'مفتوح' : 'Open'}</option>
            <option value="AWARDED">{ar ? 'مُرسى' : 'Awarded'}</option>
            <option value="CLOSED">{ar ? 'مغلق' : 'Closed'}</option>
            <option value="CANCELLED">{ar ? 'ملغى' : 'Cancelled'}</option>
          </select>
          <select
            value={modFilter}
            onChange={(e) => setModFilter(e.target.value)}
            className="input-base w-40"
          >
            <option value="">{ar ? 'كل الإشراف' : 'All Moderation'}</option>
            <option value="ACTIVE">{ar ? 'نشط' : 'Active'}</option>
            <option value="FLAGGED">{ar ? 'مُعلَّم' : 'Flagged'}</option>
            <option value="REMOVED">{ar ? 'محذوف' : 'Removed'}</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : error ? (
          <div className="card flex flex-col items-center py-14 text-center">
            <FileText className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'تعذّر تحميل البيانات' : 'Failed to load RFQs'}</p>
            <button onClick={fetchRfqs} className="mt-3 text-xs text-brand-600 hover:underline">{ar ? 'إعادة المحاولة' : 'Retry'}</button>
          </div>
        ) : rfqs.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'لا توجد طلبات' : 'No RFQs found'}</p>
            <p className="text-sm text-slate-400 mt-1">{ar ? 'جرّب تعديل معايير البحث' : 'Try adjusting your filters'}</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_180px_120px_100px_90px_80px_36px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              {[
                ar ? 'الطلب' : 'Request',
                ar ? 'المشتري' : 'Buyer',
                ar ? 'الفئة' : 'Category',
                ar ? 'الميزانية' : 'Budget',
                ar ? 'الموعد النهائي' : 'Deadline',
                ar ? 'العروض' : 'Quotes',
                '',
              ].map((h, i) => (
                <p key={i} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</p>
              ))}
            </div>

            <div className="divide-y divide-slate-50">
              {rfqs.map((rfq) => (
                <Link
                  key={rfq.id}
                  href={`${base}/admin/rfqs/${rfq.id}`}
                  className="flex md:grid md:grid-cols-[1fr_180px_120px_100px_90px_80px_36px] gap-4 items-center px-4 py-3.5 hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Title + status */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-700 transition-colors">
                      {rfq.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <StatusBadge status={rfq.status} ar={ar} />
                      {(() => {
                        const ms = rfq.moderationStatus ?? 'ACTIVE';
                        const m = MOD_META[ms] ?? { bg: 'bg-slate-100', text: 'text-slate-500' };
                        return (
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold ${m.bg} ${m.text}`}>
                            {ms}
                          </span>
                        );
                      })()}
                      <span className="text-[10px] text-slate-400">
                        {new Date(rfq.createdAt).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Buyer */}
                  <p className="hidden md:block text-xs text-slate-600 truncate">
                    {ar ? rfq.buyer?.nameAr : rfq.buyer?.nameEn}
                    {rfq.buyer?.city && <span className="text-slate-400"> · {rfq.buyer.city}</span>}
                  </p>

                  {/* Category */}
                  <p className="hidden md:block text-xs text-slate-500 truncate">
                    {ar ? rfq.category?.nameAr : rfq.category?.nameEn}
                  </p>

                  {/* Budget */}
                  <p className="hidden md:block text-xs font-medium text-slate-700">
                    {fmtBudget(rfq, ar)}
                  </p>

                  {/* Deadline */}
                  <p className="hidden md:block text-xs text-slate-500">
                    {rfq.deadline
                      ? new Date(rfq.deadline).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', { month: 'short', day: 'numeric' })
                      : '—'}
                  </p>

                  {/* Quote count */}
                  <div className="hidden md:flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">{rfq._count?.quotes ?? 0}</span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {rfq.moderationStatus && rfq.moderationStatus !== 'ACTIVE' && (
                      <button
                        onClick={(e) => moderateRFQ(rfq.id, 'restore', e)}
                        disabled={!!modActionLoading}
                        className="p-1 rounded text-green-600 hover:bg-green-50 disabled:opacity-50"
                        title="Restore"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    )}
                    {rfq.moderationStatus === 'ACTIVE' && (
                      <button
                        onClick={(e) => moderateRFQ(rfq.id, 'flag', e)}
                        disabled={!!modActionLoading}
                        className="p-1 rounded text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                        title="Flag"
                      >
                        <Flag className="h-3 w-3" />
                      </button>
                    )}
                    {rfq.moderationStatus !== 'REMOVED' && (
                      <button
                        onClick={(e) => moderateRFQ(rfq.id, 'remove', e)}
                        disabled={!!modActionLoading}
                        className="p-1 rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-400 transition-colors shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {ar ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                {ar ? 'السابق' : 'Previous'}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                {ar ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
