'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Shield, Flag, Eye, RotateCcw, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import type { ModerationStatus } from '@mwazn/contracts';

interface ModeratedItem {
  id: string;
  contentType: 'RFQ' | 'LISTING';
  title?: string;
  titleEn?: string;
  moderationStatus: ModerationStatus;
  moderationReason?: string;
  moderationSource?: string;
  moderatedAt?: string;
  createdAt: string;
  buyer?: { id: string; nameAr: string; nameEn: string };
  supplier?: { id: string; nameAr: string; nameEn: string };
}

const STATUS_META: Record<string, { bg: string; text: string; labelEn: string }> = {
  FLAGGED: { bg: 'bg-amber-100', text: 'text-amber-700', labelEn: 'Flagged' },
  REMOVED: { bg: 'bg-red-100',   text: 'text-red-700',   labelEn: 'Removed' },
  REJECTED:{ bg: 'bg-rose-100',  text: 'text-rose-700',  labelEn: 'Rejected' },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', labelEn: status };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.bg} ${m.text}`}>
      {m.labelEn}
    </span>
  );
}

export default function AdminModerationPage() {
  const locale = useLocale();
  const ar = locale === 'ar';

  const [items, setItems] = useState<ModeratedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'flagged' | 'removed'>('flagged');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/moderation', { params: { limit: 50 } });
      setItems(res.data.data?.items ?? res.data.data ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = items.filter((i) =>
    tab === 'flagged' ? i.moderationStatus === 'FLAGGED' : i.moderationStatus === 'REMOVED',
  );

  const action = async (item: ModeratedItem, act: 'remove' | 'restore' | 'flag', reason?: string) => {
    const path = item.contentType === 'RFQ'
      ? `/admin/rfqs/${item.id}/${act}`
      : `/admin/listings/${item.id}/${act}`;
    setActionLoading(`${item.id}-${act}`);
    try {
      await api.patch(path, reason ? { reason } : {});
      await fetch();
    } catch { /* silent */ }
    setActionLoading(null);
    setConfirmRemove(null);
    setReasonInput('');
  };

  const getTitle = (item: ModeratedItem) => item.title ?? item.titleEn ?? item.id;
  const getCompany = (item: ModeratedItem) => {
    const c = item.buyer ?? item.supplier;
    return c ? (ar ? c.nameAr : c.nameEn) : '—';
  };

  const tabs = [
    { key: 'flagged', label: ar ? 'مُعلَّق' : 'Flagged', icon: <Flag className="h-3.5 w-3.5" /> },
    { key: 'removed', label: ar ? 'محذوف' : 'Removed', icon: <Trash2 className="h-3.5 w-3.5" /> },
  ] as const;

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{ar ? 'قائمة الإشراف' : 'Moderation Queue'}</h1>
          </div>
          <p className="text-sm text-slate-500 ms-12">
            {ar ? 'محتوى مُعلَّق أو محذوف يحتاج مراجعة' : 'Flagged and removed content awaiting review'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map((t) => {
            const count = items.filter((i) =>
              t.key === 'flagged' ? i.moderationStatus === 'FLAGGED' : i.moderationStatus === 'REMOVED',
            ).length;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={[
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  tab === t.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                {t.icon}
                {t.label}
                {count > 0 && (
                  <span className="ml-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          <button onClick={fetch} className="ms-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-all">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <Shield className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">{ar ? 'لا يوجد محتوى في هذا القسم' : 'No content in this section'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div key={item.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${item.contentType === 'RFQ' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {item.contentType}
                      </span>
                      <StatusBadge status={item.moderationStatus} />
                      {item.moderationSource && (
                        <span className="text-[10px] text-slate-400">
                          via {item.moderationSource}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900 truncate">{getTitle(item)}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{getCompany(item)}</span>
                      {item.moderationReason && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          {item.moderationReason}
                        </span>
                      )}
                      {item.moderatedAt && (
                        <span>{new Date(item.moderatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Restore */}
                    <button
                      onClick={() => action(item, 'restore')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-all"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {ar ? 'استعادة' : 'Restore'}
                    </button>

                    {/* Remove (if not already removed) */}
                    {item.moderationStatus !== 'REMOVED' && (
                      confirmRemove === item.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder={ar ? 'السبب...' : 'Reason...'}
                            value={reasonInput}
                            onChange={(e) => setReasonInput(e.target.value)}
                            className="text-xs border border-slate-200 rounded px-2 py-1 w-32"
                          />
                          <button
                            onClick={() => action(item, 'remove', reasonInput || undefined)}
                            className="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700"
                          >
                            {ar ? 'تأكيد' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => { setConfirmRemove(null); setReasonInput(''); }}
                            className="px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-700"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemove(item.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                          {ar ? 'حذف' : 'Remove'}
                        </button>
                      )
                    )}

                    {/* Flag (if not already flagged) */}
                    {item.moderationStatus === 'REMOVED' && (
                      <button
                        onClick={() => action(item, 'flag')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
                      >
                        <Flag className="h-3 w-3" />
                        {ar ? 'تعليق' : 'Flag'}
                      </button>
                    )}

                    {/* View */}
                    <a
                      href={`/${locale}/dashboard/admin/${item.contentType === 'RFQ' ? 'rfqs' : 'listings'}/${item.id}`}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      <Eye className="h-3 w-3" />
                      {ar ? 'عرض' : 'View'}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
