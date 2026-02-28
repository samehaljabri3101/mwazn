'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Deal } from '@/types';
import { Briefcase, DollarSign, MessageSquare, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_META: Record<string, {
  color: 'green' | 'blue' | 'amber' | 'gray' | 'red';
  en: string; ar: string;
  nextEn?: string; nextAr?: string; nextStatus?: string;
}> = {
  AWARDED:     { color: 'amber', en: 'Awarded',     ar: 'مُرسى',        nextEn: 'Mark In Progress', nextAr: 'بدء التنفيذ',   nextStatus: 'IN_PROGRESS' },
  IN_PROGRESS: { color: 'blue',  en: 'In Progress', ar: 'قيد التنفيذ',  nextEn: 'Mark Delivered',   nextAr: 'تم الشحن',      nextStatus: 'DELIVERED' },
  DELIVERED:   { color: 'green', en: 'Delivered',   ar: 'تم التسليم' },
  COMPLETED:   { color: 'green', en: 'Completed',   ar: 'مكتملة' },
  CANCELLED:   { color: 'red',   en: 'Cancelled',   ar: 'ملغاة' },
};

export default function SupplierDealsPage() {
  const locale = useLocale();
  const router = useRouter();
  const ar = locale === 'ar';

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deals', { params: { limit: 50 } });
      setDeals(res.data.data?.items || res.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchDeals(); }, []);

  const updateStatus = async (dealId: string, status: string) => {
    setActionLoading(dealId);
    try {
      await api.patch(`/deals/${dealId}/status`, { status });
      await fetchDeals();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const startConversation = async (buyerId: string) => {
    try {
      const res = await api.post('/conversations/start', { participantCompanyId: buyerId });
      router.push(`/${locale}/dashboard/messages/${res.data.data.id}`);
    } catch { /* silent */ }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{ar ? 'صفقاتي' : 'My Deals'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {ar ? 'إدارة الصفقات المتاحة لك' : 'Manage your active deals'}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
        ) : deals.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-8 w-8" />}
            title={ar ? 'لا توجد صفقات بعد' : 'No deals yet'}
            description={ar ? 'قدّم عروضاً على طلبات الأسعار للحصول على صفقات' : 'Submit quotes on RFQs to win deals'}
          />
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => {
              const meta = STATUS_META[deal.status];
              return (
                <div key={deal.id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 font-bold text-slate-600 text-lg">
                        {(deal.buyer?.nameEn || 'B').charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {ar ? deal.buyer?.nameAr : deal.buyer?.nameEn}
                        </p>
                        {deal.quote?.rfq && (
                          <p className="text-sm text-slate-500 mt-0.5">{deal.quote.rfq.title}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm font-bold text-brand-700 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {deal.totalAmount.toLocaleString()} SAR
                          </span>
                          <span className="text-xs text-slate-400">
                            {format(new Date(deal.createdAt), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={meta.color}>{ar ? meta.ar : meta.en}</Badge>

                      {meta.nextStatus && (
                        <Button
                          size="sm"
                          loading={actionLoading === deal.id}
                          onClick={() => updateStatus(deal.id, meta.nextStatus!)}
                          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        >
                          {ar ? meta.nextAr : meta.nextEn}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<MessageSquare className="h-3.5 w-3.5" />}
                        onClick={() => deal.buyerId && startConversation(deal.buyerId)}
                      >
                        {ar ? 'تواصل' : 'Chat'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
