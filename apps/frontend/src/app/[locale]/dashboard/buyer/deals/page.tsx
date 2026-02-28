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
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, DollarSign, Building2, Star, CheckCircle2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_META: Record<string, { color: 'green' | 'blue' | 'amber' | 'gray' | 'red'; en: string; ar: string; next?: string; nextAr?: string }> = {
  AWARDED:     { color: 'amber', en: 'Awarded', ar: 'مُرسى', next: 'Mark In Progress', nextAr: 'بدء التنفيذ' },
  IN_PROGRESS: { color: 'blue', en: 'In Progress', ar: 'قيد التنفيذ', next: 'Mark Delivered', nextAr: 'تم الاستلام' },
  DELIVERED:   { color: 'green', en: 'Delivered', ar: 'تم التسليم', next: 'Mark Completed', nextAr: 'إتمام الصفقة' },
  COMPLETED:   { color: 'green', en: 'Completed', ar: 'مكتملة' },
  CANCELLED:   { color: 'red', en: 'Cancelled', ar: 'ملغاة' },
};

const NEXT_STATUS: Record<string, string> = {
  AWARDED: 'IN_PROGRESS',
  IN_PROGRESS: 'DELIVERED',
  DELIVERED: 'COMPLETED',
};

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
        <h3 className="text-lg font-bold text-slate-800 mb-1">{ar ? 'قيّم المورد' : 'Rate the Supplier'}</h3>
        <p className="text-sm text-slate-500 mb-6">{ar ? 'شاركنا تجربتك مع هذا المورد' : 'Share your experience with this supplier'}</p>
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

export default function BuyerDealsPage() {
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

  const startConversation = async (supplierId: string) => {
    try {
      const res = await api.post('/conversations/start', { participantCompanyId: supplierId });
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
            {ar ? 'تتبع حالة صفقاتك من الترسية حتى الإتمام' : 'Track your deals from award to completion'}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : deals.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-8 w-8" />}
            title={ar ? 'لا توجد صفقات بعد' : 'No deals yet'}
            description={ar ? 'قبّل عرضاً لبدء صفقة' : 'Accept a quote to start a deal'}
          />
        ) : (
          <div className="space-y-4">
            {deals.map((deal) => {
              const meta = STATUS_META[deal.status];
              const nextStatus = NEXT_STATUS[deal.status];
              const hasRated = deal.ratings?.some((r) => r.raterId === company?.id) ?? !!deal.rating;
              const canRate = deal.status === 'COMPLETED' && !hasRated;

              return (
                <div key={deal.id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Supplier + RFQ info */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 font-bold text-slate-600 text-lg">
                        {(deal.supplier?.nameEn || 'S').charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {ar ? deal.supplier?.nameAr : deal.supplier?.nameEn}
                        </p>
                        {deal.quote?.rfq && (
                          <p className="text-sm text-slate-500 mt-0.5">{deal.quote.rfq.title}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-sm font-bold text-brand-700">
                            <DollarSign className="h-4 w-4" />
                            {deal.totalAmount.toLocaleString()} SAR
                          </span>
                          <span className="text-xs text-slate-400">
                            {format(new Date(deal.createdAt), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status + actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={meta.color}>{ar ? meta.ar : meta.en}</Badge>

                      {nextStatus && (
                        <Button
                          size="sm"
                          loading={actionLoading === deal.id}
                          onClick={() => updateStatus(deal.id, nextStatus)}
                          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        >
                          {ar ? meta.nextAr : meta.next}
                        </Button>
                      )}

                      {canRate && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Star className="h-3.5 w-3.5" />}
                          onClick={() => setRatingDeal(deal.id)}
                        >
                          {ar ? 'قيّم المورد' : 'Rate Supplier'}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<MessageSquare className="h-3.5 w-3.5" />}
                        onClick={() => deal.supplierId && startConversation(deal.supplierId)}
                      >
                        {ar ? 'تواصل' : 'Chat'}
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      {['AWARDED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'].map((s, i) => {
                        const sm = STATUS_META[s];
                        const statusOrder = ['AWARDED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'];
                        const currentIdx = statusOrder.indexOf(deal.status);
                        const done = i <= currentIdx;
                        return (
                          <div key={s} className="flex flex-col items-center gap-1 flex-1">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                              done ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {done ? '✓' : i + 1}
                            </div>
                            <span className={`text-[10px] hidden sm:block ${done ? 'text-brand-700 font-medium' : 'text-slate-400'}`}>
                              {ar ? sm.ar : sm.en}
                            </span>
                            {i < 3 && <div className={`absolute hidden`} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rating display */}
                  {deal.rating && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                      <Star className="h-4 w-4 text-gold-500 fill-gold-500" />
                      <span className="font-medium text-gold-600">{deal.rating.score}/5</span>
                      {deal.rating.comment && <span className="text-slate-400">— {deal.rating.comment}</span>}
                    </div>
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
