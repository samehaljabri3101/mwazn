'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ScrollText, Search, ArrowLeft, AlertCircle, RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
  user?: { fullName: string; email: string };
}

// ─── Action badge ─────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const lower = action.toLowerCase();
  const isPositive = /verif|approv|complet|creat|award/i.test(lower);
  const isNegative = /reject|fail|cancel|delet/i.test(lower);
  const cls = isPositive
    ? 'bg-emerald-100 text-emerald-700'
    : isNegative
    ? 'bg-red-100 text-red-600'
    : 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {action}
    </span>
  );
}

// ─── Entity link ──────────────────────────────────────────────────────────────

function EntityLink({ entity, entityId, base }: { entity: string; entityId?: string; base: string }) {
  if (!entityId) return <span className="text-xs text-slate-400">—</span>;

  const lower = entity.toLowerCase();
  const href = lower.includes('rfq') || lower.includes('quotation')
    ? `${base}/admin/rfqs/${entityId}`
    : lower.includes('quote')
    ? `${base}/admin/quotes`
    : lower.includes('deal')
    ? `${base}/admin/deals/${entityId}`
    : lower.includes('rating')
    ? `${base}/admin/ratings`
    : `${base}/admin/companies/${entityId}`;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-0.5 text-xs text-brand-600 hover:underline font-mono"
    >
      {entity}:{entityId.slice(0, 8)}…
      <ChevronRight className="h-3 w-3" />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAuditPage() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/admin/audit-logs', {
        params: {
          page, limit,
          ...(entityFilter ? { entity: entityFilter } : {}),
        },
      });
      const data = res.data?.data ?? res.data;
      const items: AuditLog[] = data?.items ?? data ?? [];
      setLogs(items);
      setTotal(data?.meta?.total ?? data?.total ?? items.length);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [page, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [entityFilter]);

  // Client-side search
  const filtered = search
    ? logs.filter((l) => {
        const q = search.toLowerCase();
        return (
          l.action.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          (l.user?.fullName ?? '').toLowerCase().includes(q) ||
          (l.user?.email ?? '').toLowerCase().includes(q) ||
          (l.entityId ?? '').toLowerCase().includes(q)
        );
      })
    : logs;

  const totalPages = Math.ceil(total / limit);

  // Collect unique entity types from current page for filter dropdown
  const entityTypes = Array.from(new Set(logs.map((l) => l.entity))).sort();

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
                {ar ? 'سجل التدقيق' : 'Audit Log'}
              </h1>
            </div>
            <p className="text-sm text-slate-500 ps-6">
              {ar
                ? `${total} إجراء مسجّل على المنصة`
                : `${total} recorded platform actions`}
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {ar ? 'تحديث' : 'Refresh'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? 'بحث بالإجراء أو الكيان أو المستخدم...' : 'Search by action, entity or user…'}
              className="input-base ps-9 w-full"
            />
          </div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="input-base w-44"
          >
            <option value="">{ar ? 'كل الكيانات' : 'All Entities'}</option>
            {entityTypes.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : error ? (
          <div className="card flex flex-col items-center py-14 text-center">
            <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'تعذّر تحميل السجل' : 'Failed to load audit log'}</p>
            <button onClick={fetchLogs} className="mt-3 text-xs text-brand-600 hover:underline">
              {ar ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-14 text-center">
            <ScrollText className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'لا توجد إجراءات مسجّلة' : 'No audit entries found'}</p>
            <p className="text-sm text-slate-400 mt-1">{ar ? 'جرّب تعديل معايير البحث' : 'Try adjusting your filters'}</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[160px_120px_1fr_180px_140px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              {[
                ar ? 'الإجراء' : 'Action',
                ar ? 'الكيان' : 'Entity',
                ar ? 'المرجع' : 'Reference',
                ar ? 'المستخدم' : 'User',
                ar ? 'التاريخ' : 'Date',
              ].map((h, i) => (
                <p key={i} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</p>
              ))}
            </div>

            <div className="divide-y divide-slate-50">
              {filtered.map((log) => (
                <div
                  key={log.id}
                  className="flex md:grid md:grid-cols-[160px_120px_1fr_180px_140px] gap-4 items-center px-4 py-3 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Action */}
                  <div>
                    <ActionBadge action={log.action} />
                  </div>

                  {/* Entity type */}
                  <p className="hidden md:block text-xs text-slate-500 font-medium truncate">
                    {log.entity}
                  </p>

                  {/* Reference / entity link */}
                  <div className="hidden md:block">
                    <EntityLink entity={log.entity} entityId={log.entityId} base={base} />
                  </div>

                  {/* User */}
                  <div className="hidden md:block min-w-0">
                    {log.user ? (
                      <>
                        <p className="text-xs font-medium text-slate-700 truncate">{log.user.fullName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{log.user.email}</p>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">System</span>
                    )}
                  </div>

                  {/* Date */}
                  <p className="text-[10px] text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleString(ar ? 'ar-SA' : 'en-SA', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
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
