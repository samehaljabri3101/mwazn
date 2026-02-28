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
import type { Quote } from '@/types';
import { ScrollText, DollarSign, Clock, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_META: Record<string, { color: 'amber' | 'green' | 'red' | 'gray'; en: string; ar: string }> = {
  PENDING:   { color: 'amber', en: 'Pending', ar: 'معلق' },
  ACCEPTED:  { color: 'green', en: 'Accepted', ar: 'مقبول' },
  REJECTED:  { color: 'red',   en: 'Rejected', ar: 'مرفوض' },
  WITHDRAWN: { color: 'gray',  en: 'Withdrawn', ar: 'مسحوب' },
};

export default function SupplierQuotesPage() {
  const locale = useLocale();
  const ar = locale === 'ar';

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotes/my', {
        params: { status: statusFilter || undefined, limit: 50 },
      });
      setQuotes(res.data.data?.items || res.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchQuotes(); }, [statusFilter]);

  const withdrawQuote = async (quoteId: string) => {
    setActionLoading(quoteId);
    try {
      await api.patch(`/quotes/${quoteId}/withdraw`);
      await fetchQuotes();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const pendingCount = quotes.filter((q) => q.status === 'PENDING').length;
  const acceptedCount = quotes.filter((q) => q.status === 'ACCEPTED').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{ar ? 'عروضي المقدمة' : 'My Submitted Quotes'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {ar
              ? `${pendingCount} معلق · ${acceptedCount} مقبول`
              : `${pendingCount} pending · ${acceptedCount} accepted`}
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', en: 'All', ar: 'الكل' },
            { value: 'PENDING', en: 'Pending', ar: 'معلقة' },
            { value: 'ACCEPTED', en: 'Accepted', ar: 'مقبولة' },
            { value: 'REJECTED', en: 'Rejected', ar: 'مرفوضة' },
            { value: 'WITHDRAWN', en: 'Withdrawn', ar: 'مسحوبة' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                statusFilter === tab.value
                  ? 'bg-brand-700 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'
              }`}
            >
              {ar ? tab.ar : tab.en}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : quotes.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="h-8 w-8" />}
            title={ar ? 'لا توجد عروض' : 'No quotes yet'}
            description={ar ? 'قدّم عروضك على الطلبات المفتوحة' : 'Browse open RFQs and submit your offers'}
            action={
              <Link href={`/${locale}/dashboard/supplier/rfqs`}>
                <Button>{ar ? 'تصفح الطلبات' : 'Browse RFQs'}</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => {
              const meta = STATUS_META[quote.status];
              return (
                <div key={quote.id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                        <ScrollText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {quote.rfq?.title || (ar ? 'طلب عرض' : 'RFQ')}
                        </p>
                        {quote.rfq?.buyer && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {ar ? quote.rfq.buyer.nameAr : quote.rfq.buyer.nameEn}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-bold text-brand-700">
                            <DollarSign className="h-3.5 w-3.5" />
                            {quote.price.toLocaleString()} SAR
                          </span>
                          {quote.deliveryDays && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {ar ? `${quote.deliveryDays} يوم` : `${quote.deliveryDays} days`}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(quote.createdAt), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={meta.color}>{ar ? meta.ar : meta.en}</Badge>
                      {quote.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<X className="h-3.5 w-3.5" />}
                          loading={actionLoading === quote.id}
                          onClick={() => withdrawQuote(quote.id)}
                        >
                          {ar ? 'سحب' : 'Withdraw'}
                        </Button>
                      )}
                      {quote.status === 'ACCEPTED' && (
                        <Link href={`/${locale}/dashboard/supplier/deals`}>
                          <Button size="sm" variant="secondary">
                            {ar ? 'الصفقة' : 'View Deal'}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {quote.notes && (
                    <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">{quote.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
