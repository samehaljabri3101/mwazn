'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import {
  Building2, ShieldCheck, Clock, AlertTriangle, Zap, Search,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import {
  type CompanyWithDocs, type FilterState,
  DEFAULT_FILTERS, applyFilters,
} from './_utils';
import { CompanyList } from './CompanyList';
import { CompanyDetail, CompanyDetailEmpty } from './CompanyDetail';

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({
  icon, label, value, color, urgent, onClick, active,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'slate' | 'green' | 'amber' | 'red' | 'purple';
  urgent?: boolean;
  onClick?: () => void;
  active?: boolean;
}) {
  const COLORS: Record<string, string> = {
    slate:  'bg-slate-100 text-slate-600',
    green:  'bg-emerald-50 text-emerald-700',
    amber:  urgent ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' : 'bg-amber-50 text-amber-600',
    red:    urgent ? 'bg-red-100 text-red-700 ring-1 ring-red-300'       : 'bg-red-50 text-red-500',
    purple: 'bg-purple-50 text-purple-700',
  };
  const cls = [
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
    COLORS[color],
    onClick ? 'cursor-pointer hover:brightness-95 hover:shadow-sm active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-400' : '',
    active ? 'ring-2 ring-offset-1 ring-brand-500 shadow-sm' : '',
  ].join(' ');

  if (!onClick) return <div className={cls}>{icon}<span className="font-bold">{value}</span><span className="text-xs opacity-75 hidden sm:inline">{label}</span></div>;
  return (
    <button type="button" onClick={onClick} title={label} className={cls}>
      {icon}
      <span className="font-bold">{value}</span>
      <span className="text-xs opacity-75 hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCompaniesPage() {
  const locale = useLocale();
  const ar = locale === 'ar';

  // ── State ──────────────────────────────────────────────────────────────────
  const [allCompanies, setAllCompanies] = useState<CompanyWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  // ── Read URL query params on first mount ───────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const type   = params.get('type')   as FilterState['type']   | null;
    const status = params.get('status') as FilterState['status'] | null;
    const plan   = params.get('plan')   as FilterState['plan']   | null;
    const search = params.get('search');
    const id     = params.get('id');
    if (type || status || plan || search) {
      setFilters((f) => ({
        ...f,
        ...(type   ? { type }   : {}),
        ...(status ? { status } : {}),
        ...(plan   ? { plan }   : {}),
        ...(search ? { search } : {}),
      }));
    }
    if (id) setSelectedId(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync filter state → URL (enables browser Back to restore filters) ──────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (filters.type)   params.set('type',   filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.plan)   params.set('plan',   filters.plan);
    if (filters.search) params.set('search', filters.search);
    if (selectedId)     params.set('id',     selectedId);
    const qs = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, [filters, selectedId]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const companies = applyFilters(allCompanies, filters);
  const selectedCompany = allCompanies.find((c) => c.id === selectedId) ?? null;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/companies', { params: { limit: 200 } });
      const list: CompanyWithDocs[] =
        res.data?.items ??
        res.data?.data?.items ??
        [];
      setAllCompanies(list);
      const notesMap: Record<string, string> = {};
      list.forEach((c) => { if ((c as any).adminNotes) notesMap[c.id] = (c as any).adminNotes; });
      setLocalNotes((prev) => ({ ...notesMap, ...prev }));
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const stats = {
    total:             allCompanies.length,
    verifiedSuppliers: allCompanies.filter((c) => c.type === 'SUPPLIER' && c.verificationStatus === 'VERIFIED').length,
    pending:           allCompanies.filter((c) => c.verificationStatus === 'PENDING').length,
    missingDocs:       allCompanies.filter((c) =>
      c.type === 'SUPPLIER' &&
      c.verificationStatus === 'PENDING' &&
      (!c.verificationDocs || c.verificationDocs.length === 0)
    ).length,
    pro:               allCompanies.filter((c) => c.plan === 'PRO').length,
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleApprove = async (id: string, note?: string) => {
    setActionLoading(`approve-${id}`);
    try {
      await api.patch(`/verification/admin/${id}/approve`, { notes: note || undefined });
      await fetchCompanies();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const handleReject = async (id: string, note: string) => {
    setActionLoading(`reject-${id}`);
    try {
      await api.patch(`/verification/admin/${id}/reject`, { notes: note });
      await fetchCompanies();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const handleUpdatePlan = async (id: string, plan: 'FREE' | 'PRO') => {
    setActionLoading(`plan-${id}`);
    try {
      await api.patch(`/companies/${id}`, { plan });
      await fetchCompanies();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    setActionLoading(`notes-${id}`);
    try {
      await api.patch(`/companies/${id}`, { adminNotes: notes });
    } catch { /* silent */ }
    setActionLoading(null);
  };

  // ── Filter click from detail badges ────────────────────────────────────────
  const handleFilterClick = useCallback((patch: Partial<FilterState>) => {
    const nextFilters = { ...filters, ...patch };
    setFilters(nextFilters);
    // If selected company is no longer in filtered results, adjust selection
    if (selectedId) {
      const filtered = applyFilters(allCompanies, nextFilters);
      if (!filtered.find((c) => c.id === selectedId)) {
        setSelectedId(filtered.length > 0 ? filtered[0].id : null);
      }
    }
  }, [filters, allCompanies, selectedId]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {ar ? 'إدارة الشركات' : 'Manage Companies'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {ar
            ? 'مراجعة ملفات الشركات، وإدارة التوثيق والاشتراكات'
            : 'Review company profiles, manage verification and subscriptions'}
        </p>

        {/* Summary stats bar — each chip is clickable and applies a filter */}
        <div className="mt-4 flex flex-wrap gap-2">
          <StatChip
            icon={<Building2 className="h-3.5 w-3.5" />}
            label={ar ? 'الكل' : 'Total'}
            value={stats.total}
            color="slate"
            active={!filters.type && !filters.status && !filters.plan && !filters.search}
            onClick={() => { setFilters(DEFAULT_FILTERS); setSelectedId(null); }}
          />
          <StatChip
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label={ar ? 'موردون موثّقون' : 'Verified Suppliers'}
            value={stats.verifiedSuppliers}
            color="green"
            active={filters.type === 'SUPPLIER' && filters.status === 'VERIFIED'}
            onClick={() => handleFilterClick({ type: 'SUPPLIER', status: 'VERIFIED', plan: '' })}
          />
          <StatChip
            icon={<Clock className="h-3.5 w-3.5" />}
            label={ar ? 'بانتظار التوثيق' : 'Pending Review'}
            value={stats.pending}
            color="amber"
            urgent={stats.pending > 0}
            active={filters.status === 'PENDING' && filters.plan === '' && filters.type === ''}
            onClick={() => handleFilterClick({ type: '', status: 'PENDING', plan: '' })}
          />
          <StatChip
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            label={ar ? 'بدون وثائق' : 'Missing Docs'}
            value={stats.missingDocs}
            color="red"
            urgent={stats.missingDocs > 0}
            active={filters.type === 'SUPPLIER' && filters.status === 'PENDING'}
            onClick={() => handleFilterClick({ type: 'SUPPLIER', status: 'PENDING', plan: '' })}
          />
          <StatChip
            icon={<Zap className="h-3.5 w-3.5" />}
            label={ar ? 'مشتركو PRO' : 'PRO Subscribers'}
            value={stats.pro}
            color="purple"
            active={filters.plan === 'PRO'}
            onClick={() => handleFilterClick({ plan: 'PRO', type: '', status: '' })}
          />
        </div>
      </div>

      {/* ── Search + filter toolbar ────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder={ar
              ? 'بحث بالاسم أو السجل التجاري أو الرقم الضريبي أو المدينة...'
              : 'Search name, CR, VAT, or city...'}
            className="input-base ps-9 w-full"
          />
        </div>

        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as FilterState['type'] }))}
          className="input-base w-36"
        >
          <option value="">{ar ? 'كل الأنواع' : 'All Types'}</option>
          <option value="SUPPLIER">{ar ? 'موردون' : 'Suppliers'}</option>
          <option value="BUYER">{ar ? 'مشترون' : 'Buyers'}</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as FilterState['status'] }))}
          className="input-base w-40"
        >
          <option value="">{ar ? 'كل الحالات' : 'All Statuses'}</option>
          <option value="PENDING">{ar ? 'قيد المراجعة' : 'Pending'}</option>
          <option value="VERIFIED">{ar ? 'موثّق' : 'Verified'}</option>
          <option value="REJECTED">{ar ? 'مرفوض' : 'Rejected'}</option>
        </select>

        <select
          value={filters.plan}
          onChange={(e) => setFilters((f) => ({ ...f, plan: e.target.value as FilterState['plan'] }))}
          className="input-base w-32"
        >
          <option value="">{ar ? 'كل الخطط' : 'All Plans'}</option>
          <option value="PRO">PRO</option>
          <option value="FREE">FREE</option>
        </select>

        <select
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as FilterState['sort'] }))}
          className="input-base w-40"
        >
          <option value="newest">{ar ? 'الأحدث أولاً' : 'Newest First'}</option>
          <option value="oldest">{ar ? 'الأقدم أولاً' : 'Oldest First'}</option>
          <option value="name">{ar ? 'الاسم' : 'Name (A–Z)'}</option>
          <option value="cr_expiry">{ar ? 'انتهاء السجل' : 'CR Expiry'}</option>
        </select>
      </div>

      {/* ── Split panel ────────────────────────────────────────────────────── */}
      <div className="flex gap-4 items-start">

        {/* Left: company list */}
        <div className={[
          'shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden',
          'transition-all duration-200',
          selectedId
            ? 'w-full lg:w-80 xl:w-96 lg:sticky lg:top-4 lg:self-start'
            : 'w-full',
        ].join(' ')}>
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              {ar ? 'قائمة الشركات' : 'Company List'}
            </p>
          </div>
          <div className={selectedId ? 'max-h-[calc(100vh-280px)] overflow-y-auto' : undefined}>
            <CompanyList
              companies={companies}
              allCompanies={allCompanies}
              filters={filters}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
              loading={loading}
              ar={ar}
            />
          </div>
        </div>

        {/* Right: detail panel */}
        {selectedId ? (
          <div className="flex-1 min-w-0">
            {selectedCompany ? (
              <CompanyDetail
                company={selectedCompany}
                locale={locale}
                actionLoading={actionLoading}
                notes={localNotes[selectedId] ?? ''}
                onNotesChange={(v) => setLocalNotes((n) => ({ ...n, [selectedId]: v }))}
                onApprove={handleApprove}
                onReject={handleReject}
                onUpdatePlan={handleUpdatePlan}
                onSaveNotes={handleSaveNotes}
                onFilterClick={handleFilterClick}
              />
            ) : (
              <CompanyDetailEmpty ar={ar} />
            )}
          </div>
        ) : (
          /* Placeholder shown alongside list on large screens when nothing selected */
          !loading && allCompanies.length > 0 && (
            <div className="hidden lg:flex flex-1 min-w-0">
              <CompanyDetailEmpty ar={ar} />
            </div>
          )
        )}
      </div>

    </DashboardLayout>
  );
}
