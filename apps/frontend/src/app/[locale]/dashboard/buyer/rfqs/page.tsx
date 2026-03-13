'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { RFQ, PaginatedResponse } from '@/types';
import { FileText, Plus, Calendar, Tag, DollarSign, ChevronRight, Search, Flag, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'gray'> = {
  OPEN: 'green',
  CLOSED: 'gray',
  AWARDED: 'blue',
  CANCELLED: 'red',
};

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  OPEN: { en: 'Open', ar: 'مفتوح' },
  CLOSED: { en: 'Closed', ar: 'مغلق' },
  AWARDED: { en: 'Awarded', ar: 'مُرسى' },
  CANCELLED: { en: 'Cancelled', ar: 'ملغى' },
};

export default function BuyerRFQsPage() {
  const locale = useLocale();
  const ar = locale === 'ar';

  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [appealModal, setAppealModal] = useState<{ targetId: string; type: 'RFQ' } | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);
  // Track which RFQ IDs had a successful appeal submitted this session
  const [appealed, setAppealed] = useState<Set<string>>(new Set());

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rfqs/my', {
        params: { search: search || undefined, status: statusFilter || undefined, limit: 20 },
      });
      const data: PaginatedResponse<RFQ> = res.data.data;
      setRfqs(data.items);
      setTotal(data.meta.total);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchRFQs(); }, [search, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitAppeal = async () => {
    if (!appealModal || !appealReason.trim()) return;
    setAppealLoading(true);
    setAppealError(null);
    try {
      await api.post('/appeals', {
        targetType: 'RFQ',
        targetId: appealModal.targetId,
        reason: appealReason.trim(),
      });
      // Mark this RFQ as appealed so the button is replaced with confirmation
      setAppealed((prev) => { const next = new Set(prev); next.add(appealModal.targetId); return next; });
      setAppealModal(null);
      setAppealReason('');
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('already open') || err?.response?.status === 400) {
        setAppealError(ar ? 'يوجد اعتراض مفتوح بالفعل لهذا الطلب' : 'An appeal is already open for this RFQ');
      } else {
        setAppealError(ar ? 'حدث خطأ، حاول مرة أخرى' : 'Failed to submit appeal — please try again');
      }
    }
    setAppealLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{ar ? 'طلبات عروض الأسعار' : 'My RFQs'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {ar ? `${total} طلب إجمالاً` : `${total} total requests`}
            </p>
          </div>
          <Link href={`/${locale}/dashboard/buyer/rfqs/new`}>
            <Button icon={<Plus className="h-4 w-4" />}>
              {ar ? 'طلب عرض جديد' : 'New RFQ'}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? 'بحث في الطلبات...' : 'Search RFQs...'}
              className="input-base ps-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base sm:w-44"
          >
            <option value="">{ar ? 'جميع الحالات' : 'All Statuses'}</option>
            {Object.entries(STATUS_LABELS).map(([key, val]) => (
              <option key={key} value={key}>{ar ? val.ar : val.en}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : rfqs.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title={ar ? 'لا توجد طلبات بعد' : 'No RFQs yet'}
            description={ar ? 'أنشئ طلب عرض سعر للحصول على عروض من الموردين' : 'Create your first RFQ to receive quotes from suppliers'}
            action={
              <Link href={`/${locale}/dashboard/buyer/rfqs/new`}>
                <Button icon={<Plus className="h-4 w-4" />}>{ar ? 'إنشاء طلب' : 'Create RFQ'}</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {rfqs.map((rfq) => {
              const isFlagged = rfq.moderationStatus && rfq.moderationStatus !== 'ACTIVE';
              return (
                <div key={rfq.id} className="card flex flex-col gap-0">
                  <Link
                    href={`/${locale}/dashboard/buyer/rfqs/${rfq.id}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate group-hover:text-brand-700 transition-colors">
                            {rfq.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{rfq.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500">
                      {rfq.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5" />
                          {ar ? rfq.category.nameAr : rfq.category.nameEn}
                        </span>
                      )}
                      {rfq.budget && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {rfq.budget.toLocaleString()} SAR
                        </span>
                      )}
                      {rfq.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(rfq.deadline), 'dd MMM yyyy')}
                        </span>
                      )}
                      <span className="text-slate-400">
                        {ar ? `${rfq._count?.quotes ?? 0} عرض` : `${rfq._count?.quotes ?? 0} quotes`}
                      </span>
                      <Badge variant={STATUS_COLORS[rfq.status]}>
                        {ar ? STATUS_LABELS[rfq.status]?.ar : STATUS_LABELS[rfq.status]?.en}
                      </Badge>
                      {isFlagged && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${rfq.moderationStatus === 'FLAGGED' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {rfq.moderationStatus}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-slate-300 rtl-mirror" />
                    </div>
                  </Link>

                  {isFlagged && (
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-amber-100">
                      <p className="text-[11px] text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {rfq.moderationReason ?? (ar ? 'تم تقييد هذا الطلب بواسطة الإشراف' : 'This RFQ has been restricted by moderation')}
                      </p>
                      {appealed.has(rfq.id) ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium px-2">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {ar ? 'تم الاعتراض' : 'Appealed'}
                        </span>
                      ) : (
                        <button
                          onClick={() => { setAppealError(null); setAppealModal({ targetId: rfq.id, type: 'RFQ' }); }}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Flag className="h-3.5 w-3.5" />
                          {ar ? 'اعتراض' : 'Appeal'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Appeal Modal */}
      {appealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">{ar ? 'تقديم اعتراض على قرار الإشراف' : 'Appeal Moderation Decision'}</h2>
              <button onClick={() => { setAppealModal(null); setAppealReason(''); setAppealError(null); }} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              {ar
                ? 'اشرح سبب اعتراضك على قرار الإشراف على هذا الطلب. سيراجع الفريق اعتراضك ويرد عليه.'
                : 'Explain why the moderation decision on this RFQ should be reconsidered. Our team will review and respond.'}
            </p>
            <textarea
              value={appealReason}
              onChange={(e) => { setAppealReason(e.target.value); setAppealError(null); }}
              rows={4}
              placeholder={ar ? 'سبب الاعتراض...' : 'Reason for appeal...'}
              className="input-base w-full resize-none"
            />
            {appealError && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {appealError}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => { setAppealModal(null); setAppealReason(''); setAppealError(null); }}>
                {ar ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                loading={appealLoading}
                disabled={!appealReason.trim()}
                onClick={submitAppeal}
              >
                {ar ? 'إرسال الاعتراض' : 'Submit Appeal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
