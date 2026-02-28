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
import { FileText, Plus, Calendar, Tag, DollarSign, ChevronRight, Search } from 'lucide-react';
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

  useEffect(() => { fetchRFQs(); }, [search, statusFilter]);

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
            {rfqs.map((rfq) => (
              <Link
                key={rfq.id}
                href={`/${locale}/dashboard/buyer/rfqs/${rfq.id}`}
                className="card card-hover flex flex-col sm:flex-row sm:items-center gap-4 group"
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
                  <ChevronRight className="h-4 w-4 text-slate-300 rtl-mirror" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
