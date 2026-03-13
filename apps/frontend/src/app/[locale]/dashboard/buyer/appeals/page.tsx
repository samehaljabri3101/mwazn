'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Flag, RefreshCw, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';
import type { AppealStatus } from '@mwazn/contracts';

interface MyAppeal {
  id: string;
  targetType: 'RFQ' | 'LISTING';
  targetId: string;
  targetTitle?: string | null;
  targetModerationReason?: string | null;
  appealStatus: AppealStatus;
  originalModerationStatus: string;
  reason: string;
  adminResponse?: string;
  reviewedAt?: string;
  createdAt: string;
}

const STATUS_META: Record<string, { bg: string; text: string; labelEn: string; labelAr: string }> = {
  OPEN:         { bg: 'bg-blue-100',  text: 'text-blue-700',  labelEn: 'Open',         labelAr: 'مفتوح' },
  UNDER_REVIEW: { bg: 'bg-amber-100', text: 'text-amber-700', labelEn: 'Under Review',  labelAr: 'قيد المراجعة' },
  ACCEPTED:     { bg: 'bg-green-100', text: 'text-green-700', labelEn: 'Accepted',      labelAr: 'مقبول' },
  REJECTED:     { bg: 'bg-red-100',   text: 'text-red-700',   labelEn: 'Rejected',      labelAr: 'مرفوض' },
  CLOSED:       { bg: 'bg-slate-100', text: 'text-slate-500', labelEn: 'Closed',        labelAr: 'مغلق' },
};

export default function BuyerAppealsPage() {
  const locale = useLocale();
  const ar = locale === 'ar';

  const [appeals, setAppeals] = useState<MyAppeal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/appeals/my', { params: { limit: 50 } });
      // filter to RFQ type only for buyer context
      const all = res.data.data?.items ?? res.data.data ?? [];
      setAppeals(all.filter((a: MyAppeal) => a.targetType === 'RFQ'));
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Flag className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{ar ? 'اعتراضاتي' : 'My Appeals'}</h1>
                <p className="text-xs text-slate-500">{ar ? 'اعتراضاتك على قرارات الإشراف لطلبات الأسعار' : 'Your appeals against moderation decisions on RFQs'}</p>
              </div>
            </div>
            <button onClick={fetch} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : appeals.length === 0 ? (
          <EmptyState
            icon={<Flag className="h-8 w-8 text-slate-300" />}
            title={ar ? 'لا توجد اعتراضات' : 'No appeals yet'}
            description={ar
              ? 'لم تقدّم أي اعتراضات حتى الآن. يمكنك الاعتراض من صفحة طلبات الأسعار.'
              : 'No appeals submitted yet. You can appeal from your RFQs page.'}
          />
        ) : (
          <div className="space-y-3">
            {appeals.map((appeal) => {
              const meta = STATUS_META[appeal.appealStatus];
              return (
                <div key={appeal.id} className="card">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        RFQ
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta?.bg ?? 'bg-gray-100'} ${meta?.text ?? 'text-gray-600'}`}>
                        {ar ? meta?.labelAr : meta?.labelEn}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{new Date(appeal.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-2">
                    {appeal.targetTitle && (
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{appeal.targetTitle}</p>
                          {appeal.targetModerationReason && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {ar ? 'سبب الإشراف: ' : 'Moderation reason: '}{appeal.targetModerationReason}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/${locale}/dashboard/buyer/rfqs`}
                          className="shrink-0 flex items-center gap-1 text-xs text-brand-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {ar ? 'عرض' : 'View'}
                        </Link>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">{ar ? 'سبب الاعتراض' : 'Appeal reason'}</p>
                      <p className="text-sm text-slate-700">{appeal.reason}</p>
                    </div>

                    {appeal.adminResponse && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-0.5">{ar ? 'رد الإدارة' : 'Admin response'}</p>
                        <p className="text-sm text-slate-700">{appeal.adminResponse}</p>
                        {appeal.reviewedAt && (
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(appeal.reviewedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
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
