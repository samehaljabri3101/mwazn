'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Deal } from '@/types';
import { Briefcase, DollarSign, MessageSquare, CheckCircle2, Star } from 'lucide-react';
import { format } from 'date-fns';

function RatingModal({ dealId, onClose, onDone }: { dealId: string; onClose: () => void; onDone: () => void }) {
  const locale = useLocale();
  const ar = locale === 'ar';
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/ratings', { dealId, score, comment });
      onDone();
    } catch { /* silent */ }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-1">{ar ? 'قيّم المشتري' : 'Rate the Buyer'}</h3>
        <p className="text-sm text-slate-500 mb-6">{ar ? 'شاركنا تجربتك مع هذا المشتري' : 'Share your experience with this buyer'}</p>
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setScore(s)}
              className={`text-3xl transition-transform ${s <= score ? 'text-gold-500' : 'text-slate-200'} hover:scale-110`}
            >★</button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={ar ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
          className="input-base resize-none mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{ar ? 'إلغاء' : 'Cancel'}</Button>
          <Button loading={loading} icon={<Star className="h-4 w-4" />} onClick={submit}>
            {ar ? 'إرسال التقييم' : 'Submit Rating'}
          </Button>
        </div>
      </div>
    </div>
  );
}

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
  const { company } = useAuth();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ratingDeal, setRatingDeal] = useState<string | null>(null);

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
      {ratingDeal && (
        <RatingModal
          dealId={ratingDeal}
          onClose={() => setRatingDeal(null)}
          onDone={() => { setRatingDeal(null); fetchDeals(); }}
        />
      )}
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
              const hasRated = deal.ratings?.some((r) => r.raterId === company?.id);
              const canRate = deal.status === 'COMPLETED' && !hasRated;
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

                      {canRate && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Star className="h-3.5 w-3.5" />}
                          onClick={() => setRatingDeal(deal.id)}
                        >
                          {ar ? 'قيّم المشتري' : 'Rate Buyer'}
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
