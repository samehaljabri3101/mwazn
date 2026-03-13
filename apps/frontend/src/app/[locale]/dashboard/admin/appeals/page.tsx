'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Flag, CheckCircle2, XCircle, MessageSquare, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import type { AppealStatus } from '@mwazn/contracts';

interface Appeal {
  id: string;
  targetType: 'RFQ' | 'LISTING';
  targetId: string;
  appellantUserId: string;
  appellantCompanyId: string;
  appealStatus: AppealStatus;
  originalModerationStatus: string;
  reason: string;
  adminResponse?: string;
  reviewedAt?: string;
  createdAt: string;
  appellantUser?: { id: string; fullName: string; email: string };
}

const STATUS_META: Record<string, { bg: string; text: string; labelEn: string }> = {
  OPEN:         { bg: 'bg-blue-100',   text: 'text-blue-700',   labelEn: 'Open' },
  UNDER_REVIEW: { bg: 'bg-amber-100',  text: 'text-amber-700',  labelEn: 'Under Review' },
  ACCEPTED:     { bg: 'bg-green-100',  text: 'text-green-700',  labelEn: 'Accepted' },
  REJECTED:     { bg: 'bg-red-100',    text: 'text-red-700',    labelEn: 'Rejected' },
  CLOSED:       { bg: 'bg-slate-100',  text: 'text-slate-500',  labelEn: 'Closed' },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', labelEn: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.bg} ${m.text}`}>
      {m.labelEn}
    </span>
  );
}

type TabKey = 'open' | 'under_review' | 'resolved';

const TAB_STATUSES: Record<TabKey, AppealStatus[]> = {
  open: ['OPEN'],
  under_review: ['UNDER_REVIEW'],
  resolved: ['ACCEPTED', 'REJECTED', 'CLOSED'],
};

export default function AdminAppealsPage() {
  const locale = useLocale();
  const ar = locale === 'ar';

  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('open');
  const [selected, setSelected] = useState<Appeal | null>(null);
  const [response, setResponse] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/appeals', { params: { limit: 100 } });
      setAppeals(res.data.data?.items ?? res.data.data ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = appeals.filter((a) => TAB_STATUSES[tab].includes(a.appealStatus));

  const doAction = async (id: string, action: 'respond' | 'accept' | 'reject') => {
    setActionLoading(`${id}-${action}`);
    try {
      await api.patch(`/admin/appeals/${id}/${action}`, { adminResponse: response || undefined });
      await fetch();
      setSelected(null);
      setResponse('');
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const tabs: Array<{ key: TabKey; labelEn: string; labelAr: string }> = [
    { key: 'open',         labelEn: 'Open',         labelAr: 'مفتوح' },
    { key: 'under_review', labelEn: 'Under Review',  labelAr: 'قيد المراجعة' },
    { key: 'resolved',     labelEn: 'Resolved',      labelAr: 'محسوم' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Flag className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{ar ? 'الاعتراضات' : 'Moderation Appeals'}</h1>
          </div>
          <p className="text-sm text-slate-500 ms-12">
            {ar ? 'اعتراضات المستخدمين على قرارات الإشراف' : 'User appeals against moderation decisions'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map((t) => {
            const count = appeals.filter((a) => TAB_STATUSES[t.key].includes(a.appealStatus)).length;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={[
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                {ar ? t.labelAr : t.labelEn}
                {count > 0 && (
                  <span className="ml-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5">{count}</span>
                )}
              </button>
            );
          })}
          <button onClick={fetch} className="ms-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-all">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* List + Detail Panel */}
        <div className={selected ? 'grid grid-cols-2 gap-4' : ''}>
          {/* List */}
          <div>
            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="card text-center py-12">
                <Flag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">{ar ? 'لا توجد اعتراضات' : 'No appeals in this section'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((appeal) => (
                  <button
                    key={appeal.id}
                    onClick={() => { setSelected(appeal); setResponse(appeal.adminResponse ?? ''); }}
                    className={[
                      'w-full text-start card hover:shadow-md transition-all',
                      selected?.id === appeal.id ? 'ring-2 ring-brand-400' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${appeal.targetType === 'RFQ' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {appeal.targetType}
                        </span>
                        <StatusBadge status={appeal.appealStatus} />
                      </div>
                      <span className="text-xs text-slate-400">{new Date(appeal.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{appeal.reason}</p>
                    {appeal.appellantUser && (
                      <p className="text-xs text-slate-400 mt-1">{appeal.appellantUser.fullName} · {appeal.appellantUser.email}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="card h-fit sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">{ar ? 'تفاصيل الاعتراض' : 'Appeal Detail'}</h3>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 text-lg leading-none">✕</button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">{ar ? 'النوع' : 'Type'}</p>
                  <span className={`text-xs font-semibold ${selected.targetType === 'RFQ' ? 'text-blue-700' : 'text-purple-700'}`}>
                    {selected.targetType} — {selected.targetId}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">{ar ? 'سبب الاعتراض' : 'Appeal Reason'}</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2">{selected.reason}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{ar ? 'رد الإدارة' : 'Admin Response'}</p>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={3}
                    placeholder={ar ? 'رد الإدارة (اختياري)...' : 'Admin response (optional)...'}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              </div>

              {/* Actions */}
              {selected.appealStatus !== 'ACCEPTED' && selected.appealStatus !== 'REJECTED' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => doAction(selected.id, 'accept')}
                    disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {ar ? 'قبول' : 'Accept'}
                  </button>
                  <button
                    onClick={() => doAction(selected.id, 'reject')}
                    disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-all"
                  >
                    <XCircle className="h-4 w-4" />
                    {ar ? 'رفض' : 'Reject'}
                  </button>
                  {selected.appealStatus === 'OPEN' && (
                    <button
                      onClick={() => doAction(selected.id, 'respond')}
                      disabled={!!actionLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-all"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
