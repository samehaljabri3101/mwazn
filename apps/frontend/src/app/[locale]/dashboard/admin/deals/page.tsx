'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase, Search, ArrowLeft,
  CheckCircle2, XCircle, Clock, Loader2, AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Deal {
  id: string;
  status: string;
  createdAt: string;
  notes?: string;
  quote?: { rfq?: { id?: string; title?: string } };
  buyer?: { id: string; nameAr: string; nameEn: string };
  supplier?: { id: string; nameAr: string; nameEn: string };
  ratings?: { id: string }[];
}

// ─── Status meta ──────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { icon: React.ReactNode; bg: string; text: string; labelEn: string; labelAr: string }> = {
  AWARDED:     { icon: <CheckCircle2 className="h-3 w-3" />, bg: 'bg-blue-100',    text: 'text-blue-700',    labelEn: 'Awarded',     labelAr: 'مُرسى'       },
  IN_PROGRESS: { icon: <Loader2 className="h-3 w-3" />,      bg: 'bg-amber-100',   text: 'text-amber-700',   labelEn: 'In Progress', labelAr: 'قيد التنفيذ' },
  DELIVERED:   { icon: <CheckCircle2 className="h-3 w-3" />, bg: 'bg-teal-100',    text: 'text-teal-700',    labelEn: 'Delivered',   labelAr: 'تم التسليم'  },
  COMPLETED:   { icon: <CheckCircle2 className="h-3 w-3" />, bg: 'bg-emerald-100', text: 'text-emerald-700', labelEn: 'Completed',   labelAr: 'مكتملة'      },
  CANCELLED:   { icon: <XCircle className="h-3 w-3" />,      bg: 'bg-red-100',     text: 'text-red-600',     labelEn: 'Cancelled',   labelAr: 'ملغاة'       },
};

function StatusBadge({ status, ar }: { status: string; ar: boolean }) {
  const meta = STATUS_META[status] ?? STATUS_META.AWARDED;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.bg} ${meta.text}`}>
      {meta.icon}
      {ar ? meta.labelAr : meta.labelEn}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDealsPage() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;
  const router = useRouter();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 30;

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/deals', {
        params: {
          page, limit,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      });
      const data = res.data?.data ?? res.data;
      const items: Deal[] = data?.items ?? data ?? [];
      setDeals(items);
      setTotal(data?.meta?.total ?? data?.total ?? items.length);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  // Client-side search filter
  const filtered = search
    ? deals.filter((d) => {
        const rfqTitle = d.quote?.rfq?.title?.toLowerCase() ?? '';
        const buyerName = (ar ? d.buyer?.nameAr : d.buyer?.nameEn)?.toLowerCase() ?? '';
        const supplierName = (ar ? d.supplier?.nameAr : d.supplier?.nameEn)?.toLowerCase() ?? '';
        const q = search.toLowerCase();
        return rfqTitle.includes(q) || buyerName.includes(q) || supplierName.includes(q);
      })
    : deals;

  const totalPages = Math.ceil(total / limit);

  // Summary counts
  const active    = deals.filter((d) => ['AWARDED', 'IN_PROGRESS', 'DELIVERED'].includes(d.status)).length;
  const completed = deals.filter((d) => d.status === 'COMPLETED').length;

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
                {ar ? 'صفقات المنصة' : 'Platform Deals'}
              </h1>
            </div>
            <p className="text-sm text-slate-500 ps-6">
              {ar ? `${total} صفقة على المنصة` : `${total} deals on the platform`}
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
              placeholder={ar ? 'بحث بالمشتري أو المورّد أو الطلب...' : 'Search buyer, supplier or RFQ…'}
              className="input-base ps-9 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base w-44"
          >
            <option value="">{ar ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="AWARDED">{ar ? 'مُرسى' : 'Awarded'}</option>
            <option value="IN_PROGRESS">{ar ? 'قيد التنفيذ' : 'In Progress'}</option>
            <option value="DELIVERED">{ar ? 'تم التسليم' : 'Delivered'}</option>
            <option value="COMPLETED">{ar ? 'مكتملة' : 'Completed'}</option>
            <option value="CANCELLED">{ar ? 'ملغاة' : 'Cancelled'}</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : error ? (
          <div className="card flex flex-col items-center py-14 text-center">
            <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'تعذّر تحميل البيانات' : 'Failed to load deals'}</p>
            <button onClick={fetchDeals} className="mt-3 text-xs text-brand-600 hover:underline">
              {ar ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-14 text-center">
            <Briefcase className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'لا توجد صفقات' : 'No deals found'}</p>
            <p className="text-sm text-slate-400 mt-1">{ar ? 'جرّب تعديل معايير البحث' : 'Try adjusting your filters'}</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_180px_180px_110px_80px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              {[
                ar ? 'طلب العرض' : 'RFQ / Reference',
                ar ? 'المشتري' : 'Buyer',
                ar ? 'المورّد' : 'Supplier',
                ar ? 'الحالة' : 'Status',
                ar ? 'التقييمات' : 'Ratings',
              ].map((h, i) => (
                <p key={i} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</p>
              ))}
            </div>

            <div className="divide-y divide-slate-50">
              {filtered.map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => router.push(`${base}/admin/deals/${deal.id}`)}
                  className="flex md:grid md:grid-cols-[1fr_180px_180px_110px_80px] gap-4 items-center px-4 py-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  {/* RFQ title + date — inner link stops propagation */}
                  <div className="min-w-0">
                    {deal.quote?.rfq?.id ? (
                      <Link
                        href={`${base}/admin/rfqs/${deal.quote.rfq.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-semibold text-slate-800 truncate block hover:text-brand-700 transition-colors"
                      >
                        {deal.quote.rfq.title ?? (ar ? 'صفقة' : 'Deal')}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {deal.quote?.rfq?.title ?? (ar ? 'صفقة' : 'Deal')}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(deal.createdAt).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Buyer */}
                  {deal.buyer?.id ? (
                    <Link
                      href={`${base}/admin/companies/${deal.buyer.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hidden md:block text-xs text-brand-600 hover:underline truncate"
                    >
                      {ar ? deal.buyer.nameAr : deal.buyer.nameEn}
                    </Link>
                  ) : (
                    <span className="hidden md:block text-xs text-slate-400">—</span>
                  )}

                  {/* Supplier */}
                  {deal.supplier?.id ? (
                    <Link
                      href={`${base}/admin/companies/${deal.supplier.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hidden md:block text-xs text-brand-600 hover:underline truncate"
                    >
                      {ar ? deal.supplier.nameAr : deal.supplier.nameEn}
                    </Link>
                  ) : (
                    <span className="hidden md:block text-xs text-slate-400">—</span>
                  )}

                  {/* Status */}
                  <div className="hidden md:block">
                    <StatusBadge status={deal.status} ar={ar} />
                  </div>

                  {/* Ratings count + view arrow */}
                  <div className="hidden md:flex items-center justify-between">
                    <span className="text-xs text-slate-500">{deal.ratings?.length ?? 0}</span>
                    <span className="text-[10px] font-medium text-brand-500 group-hover:underline">→</span>
                  </div>
                </div>
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
