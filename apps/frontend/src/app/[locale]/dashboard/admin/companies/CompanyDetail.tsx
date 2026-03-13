'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Clock, XCircle, CheckCircle2, AlertTriangle,
  ExternalLink, FileText, Zap, Building2,
  Phone, Globe, MapPin, CalendarDays, User, ReceiptText,
  ArrowUpRight, RotateCcw, CreditCard, Info,
  Briefcase, Star, MessageSquare, Package, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  type CompanyWithDocs, type FilterState,
  getWarnings, hasCriticalWarning, getEffectiveStatus, fmtDate, fmtCurrency,
  getPlanStatus, getPlanDaysLeft,
  REQUIRED_DOCS_CHECKLIST, DOC_TYPE_LABELS,
} from './_utils';

// ─── Confirmation modal ────────────────────────────────────────────────────────

function ConfirmModal({
  title, message, confirmLabel, confirmVariant = 'danger',
  onConfirm, onCancel, loading,
}: {
  title: string; message: string; confirmLabel: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-lift overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} className="flex-1" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Clickable filter badge ────────────────────────────────────────────────────

function FilterBadge({
  children,
  className = '',
  onClick,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
}) {
  if (!onClick) {
    return <span className={className}>{children}</span>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        className,
        'cursor-pointer transition-all duration-100',
        'hover:ring-2 hover:ring-offset-1 hover:ring-brand-300 hover:brightness-95',
        'active:scale-95',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ─── Detail field ──────────────────────────────────────────────────────────────

function DetailField({ label, value, mono = false, className = '' }: {
  label: string; value?: string | number | null; mono?: boolean; className?: string;
}) {
  if (!value) return null;
  return (
    <div className={className}>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

// ─── Info row (for subscription details) ──────────────────────────────────────

function InfoRow({
  label, value, valueClassName = '', unavailable = false,
}: {
  label: string;
  value?: React.ReactNode;
  valueClassName?: string;
  unavailable?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 shrink-0">{label}</span>
      {unavailable ? (
        <span className="text-xs text-slate-400 italic">Not available</span>
      ) : (
        <span className={`text-sm font-semibold text-slate-800 text-end ${valueClassName}`}>
          {value ?? '—'}
        </span>
      )}
    </div>
  );
}

// ─── Section card ──────────────────────────────────────────────────────────────

function Section({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-slate-400">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Commercial Snapshot ──────────────────────────────────────────────────────

function CommercialSnapshot({ company, ar, locale }: {
  company: CompanyWithDocs; ar: boolean; locale: string;
}) {
  const base = `/${locale}/dashboard`;
  const isSupplier = company.type === 'SUPPLIER';
  const totalDeals = (company._count?.dealsAsBuyer ?? 0) + (company._count?.dealsAsSupplier ?? 0);
  const ratingCount = company._count?.ratingsReceived ?? 0;
  const platformScore = company.supplierScore ?? null;
  const avgRating = company.avgRating ?? null;

  const stats: Array<{ icon: React.ReactNode; label: string; value: string | number }> = [];

  if (isSupplier) {
    stats.push(
      { icon: <Package className="h-4 w-4" />, label: ar ? 'منتجات مدرجة' : 'Products Listed', value: company._count?.listings ?? 0 },
      { icon: <MessageSquare className="h-4 w-4" />, label: ar ? 'عروض مقدّمة' : 'Quotes Submitted', value: company._count?.quotesSubmitted ?? 0 },
    );
  } else {
    stats.push(
      { icon: <FileText className="h-4 w-4" />, label: ar ? 'طلبات أسعار' : 'RFQs Created', value: company._count?.rfqs ?? 0 },
    );
  }

  stats.push(
    { icon: <Briefcase className="h-4 w-4" />, label: ar ? 'إجمالي الصفقات' : 'Total Deals', value: totalDeals },
  );

  if (isSupplier) {
    stats.push(
      { icon: <Star className="h-4 w-4" />, label: ar ? 'تقييم العملاء ★' : 'Customer Rating ★', value: avgRating != null ? `${avgRating.toFixed(1)} / 5` : '—' },
      { icon: <BarChart3 className="h-4 w-4" />, label: ar ? 'نقاط المنصة /100' : 'Platform Score /100', value: platformScore != null ? Math.round(platformScore) : '—' },
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
          {ar ? 'اللقطة التجارية' : 'Commercial Snapshot'}
        </h3>
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[10px] text-slate-400 shrink-0">
          {ar ? 'عضو منذ' : 'Member since'}{' '}
          {new Date(company.createdAt).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', {
            year: 'numeric', month: 'short',
          })}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {stats.map(({ icon, label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
            <div className="text-slate-300">{icon}</div>
            <p className="text-2xl font-bold text-slate-800 tabular-nums">{value}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Risk indicators */}
      {isSupplier && (
        <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-2">
          <span className={[
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            company.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
            company.verificationStatus === 'PENDING'  ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-600',
          ].join(' ')}>
            <ShieldCheck className="h-2.5 w-2.5" />
            {ar
              ? (company.verificationStatus === 'VERIFIED' ? 'موثّق' : company.verificationStatus === 'PENDING' ? 'قيد المراجعة' : 'مرفوض')
              : (company.verificationStatus === 'VERIFIED' ? 'CR Verified' : company.verificationStatus === 'PENDING' ? 'Pending Review' : 'Rejected')}
          </span>
          <span className={[
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            company.plan === 'PRO' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500',
          ].join(' ')}>
            <Zap className="h-2.5 w-2.5" />
            {company.plan === 'PRO' ? 'PRO Plan' : 'Free Plan'}
          </span>
          {!company.phone && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700">
              <AlertTriangle className="h-2.5 w-2.5" />
              {ar ? 'هاتف مفقود' : 'Missing Phone'}
            </span>
          )}
          {company.crExpiryDate && new Date(company.crExpiryDate) < new Date() && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-600">
              <AlertTriangle className="h-2.5 w-2.5" />
              {ar ? 'السجل منتهٍ' : 'CR Expired'}
            </span>
          )}
        </div>
      )}

      {/* Navigation links */}
      <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-3">
        <a
          href={`${base}/admin/deals`}
          className="text-[11px] text-brand-600 hover:underline font-medium flex items-center gap-0.5"
        >
          {ar ? 'الصفقات' : 'View Deals'} <ArrowUpRight className="h-3 w-3" />
        </a>
        {isSupplier && (
          <a
            href={`${base}/admin/rfqs`}
            className="text-[11px] text-brand-600 hover:underline font-medium flex items-center gap-0.5"
          >
            {ar ? 'طلبات الأسعار' : 'RFQs'} <ArrowUpRight className="h-3 w-3" />
          </a>
        )}
        {isSupplier && (
          <a
            href={`${base}/admin/ratings`}
            className="text-[11px] text-brand-600 hover:underline font-medium flex items-center gap-0.5"
          >
            {ar ? 'التقييمات' : 'Ratings'} <ArrowUpRight className="h-3 w-3" />
          </a>
        )}
        {isSupplier && (company.slug || company.id) && (
          <a
            href={`/${locale}/suppliers/${company.slug || company.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-500 hover:underline font-medium flex items-center gap-0.5"
          >
            {ar ? 'عرض الواجهة العامة' : 'Public Profile'} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function CompanyDetailEmpty({ ar }: { ar: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
        <Building2 className="h-7 w-7 text-slate-400" />
      </div>
      <p className="text-base font-semibold text-slate-600 mb-1">
        {ar ? 'اختر شركة للمراجعة' : 'Select a company to review'}
      </p>
      <p className="text-sm text-slate-400 max-w-xs">
        {ar
          ? 'انقر على أي شركة في القائمة لعرض تفاصيلها وإجراء المراجعة'
          : 'Click any company in the list to view its details and manage verification'}
      </p>
    </div>
  );
}

// ─── Main detail panel ────────────────────────────────────────────────────────

export function CompanyDetail({
  company, locale, actionLoading, notes, onNotesChange,
  onApprove, onReject, onUpdatePlan, onSaveNotes,
  onFilterClick,
}: {
  company: CompanyWithDocs;
  locale: string;
  actionLoading: string | null;
  notes: string;
  onNotesChange: (v: string) => void;
  onApprove: (id: string, note?: string) => void;
  onReject: (id: string, note: string) => void;
  onUpdatePlan: (id: string, plan: 'FREE' | 'PRO') => void;
  onSaveNotes: (id: string, notes: string) => void;
  onFilterClick?: (patch: Partial<FilterState>) => void;
}) {
  const ar = locale === 'ar';
  const [rejectNote, setRejectNote] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [showRejectField, setShowRejectField] = useState(false);
  const [confirmModal, setConfirmModal] = useState<'revoke' | 'downgrade' | null>(null);

  const warnings  = getWarnings(company);
  const critical  = hasCriticalWarning(warnings);
  const status    = getEffectiveStatus(company);
  const planStatus = getPlanStatus(company);
  const planDaysLeft = getPlanDaysLeft(company);

  const isPending  = company.verificationStatus === 'PENDING';
  const isVerified = company.verificationStatus === 'VERIFIED';
  const isRejected = company.verificationStatus === 'REJECTED';
  const isSupplier = company.type === 'SUPPLIER';
  const showroomSlug = company.slug || company.id;

  // CR expiry analysis
  const crDaysLeft = company.crExpiryDate
    ? Math.floor((new Date(company.crExpiryDate).getTime() - Date.now()) / 86_400_000)
    : null;

  // Document checklist
  const uploadedTypes = new Set(company.verificationDocs?.map((d) => d.type) ?? []);

  // Warning labels
  const WARNING_LABELS: Record<string, { en: string; ar: string; critical: boolean }> = {
    NO_DOCUMENTS:      { en: 'No documents uploaded',     ar: 'لم يُرفع أي مستند',          critical: true  },
    CR_EXPIRED:        { en: 'CR expired',                ar: 'السجل التجاري منتهي',         critical: true  },
    CR_EXPIRING_SOON:  { en: 'CR expiring soon',          ar: 'السجل التجاري ينتهي قريباً',  critical: false },
    MISSING_PHONE:     { en: 'No phone number',           ar: 'رقم الهاتف مفقود',            critical: false },
    MISSING_CITY:      { en: 'City not set',              ar: 'المدينة غير محددة',           critical: false },
    INACTIVE:          { en: 'Account inactive',          ar: 'الحساب غير نشط',              critical: true  },
  };

  // Plan status color map
  const PLAN_STATUS_COLORS: Record<string, string> = {
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red:   'bg-red-100 text-red-700',
    gray:  'bg-slate-100 text-slate-500',
  };

  return (
    <>
      {/* Confirmation modals */}
      {confirmModal === 'revoke' && (
        <ConfirmModal
          title={ar ? 'إلغاء التوثيق' : 'Revoke Verification'}
          message={ar
            ? 'سيتم إعادة المورد إلى حالة "مرفوض". هل أنت متأكد؟'
            : 'This will move the supplier back to Rejected status. Are you sure?'}
          confirmLabel={ar ? 'إلغاء التوثيق' : 'Revoke Verification'}
          loading={actionLoading === `reject-${company.id}`}
          onConfirm={() => { onReject(company.id, 'Verification revoked by admin'); setConfirmModal(null); }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {confirmModal === 'downgrade' && (
        <ConfirmModal
          title={ar ? 'تخفيض الخطة' : 'Downgrade to FREE'}
          message={ar
            ? 'سيفقد المورد مميزات PRO فوراً.'
            : 'The supplier will lose PRO features immediately.'}
          confirmLabel={ar ? 'تخفيض الخطة' : 'Downgrade to FREE'}
          loading={actionLoading === `plan-${company.id}`}
          onConfirm={() => { onUpdatePlan(company.id, 'FREE'); setConfirmModal(null); }}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      <div className="space-y-4">

        {/* ── Header card ─────────────────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 text-xl font-bold">
              {(ar ? company.nameAr : company.nameEn).charAt(0).toUpperCase()}
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {ar ? company.nameAr : company.nameEn}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {ar ? company.nameEn : company.nameAr}
              </p>

              {/* Clickable badges row */}
              <div className="mt-2 flex flex-wrap items-center gap-2">

                {/* Type badge — click → type filter */}
                <FilterBadge
                  title={ar ? 'تصفية حسب النوع' : 'Filter by type'}
                  onClick={onFilterClick
                    ? () => onFilterClick({ type: company.type as FilterState['type'] })
                    : undefined}
                  className={[
                    'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold',
                    isSupplier ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
                  ].join(' ')}
                >
                  {ar
                    ? (isSupplier ? 'مورّد' : 'مشترٍ')
                    : (isSupplier ? 'Supplier' : 'Buyer')}
                </FilterBadge>

                {/* Effective status badge — click → status filter */}
                <FilterBadge
                  title={ar ? 'تصفية حسب الحالة' : 'Filter by status'}
                  onClick={onFilterClick
                    ? () => onFilterClick({ status: company.verificationStatus as FilterState['status'] })
                    : undefined}
                  className={[
                    'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold',
                    status.color === 'green' ? 'bg-emerald-100 text-emerald-700' :
                    status.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                    status.color === 'red'   ? 'bg-red-100 text-red-700' :
                    status.color === 'blue'  ? 'bg-blue-100 text-blue-700' :
                                               'bg-slate-100 text-slate-600',
                  ].join(' ')}
                >
                  {ar ? status.labelAr : status.labelEn}
                </FilterBadge>

                {/* Plan badge — click → plan filter */}
                <FilterBadge
                  title={ar ? 'تصفية حسب الخطة' : 'Filter by plan'}
                  onClick={onFilterClick
                    ? () => onFilterClick({ plan: company.plan as FilterState['plan'] })
                    : undefined}
                  className={[
                    'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold',
                    company.plan === 'PRO' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500',
                  ].join(' ')}
                >
                  {company.plan}
                </FilterBadge>

                {/* City — click → search by city */}
                {company.city && (
                  <FilterBadge
                    title={ar ? 'بحث حسب المدينة' : 'Search by city'}
                    onClick={onFilterClick
                      ? () => onFilterClick({ search: company.city! })
                      : undefined}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 bg-slate-50 border border-slate-200"
                  >
                    <MapPin className="h-3 w-3" />
                    {company.city}
                  </FilterBadge>
                )}
              </div>

              {/* Sector tags — click → search by sector */}
              {company.sectors && company.sectors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {company.sectors.slice(0, 3).map((s) => (
                    <FilterBadge
                      key={s}
                      title={ar ? 'بحث بهذا القطاع' : 'Search by sector'}
                      onClick={onFilterClick
                        ? () => onFilterClick({ search: s })
                        : undefined}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      {s}
                    </FilterBadge>
                  ))}
                  {company.sectors.length > 3 && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
                      +{company.sectors.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Showroom link */}
            {isSupplier && (
              <Link
                href={`/${locale}/suppliers/${showroomSlug}`}
                target="_blank"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-all"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                {ar ? 'الملف العام' : 'Public Profile'}
              </Link>
            )}
          </div>

          {/* Warning flags */}
          {warnings.length > 0 && (
            <div className={[
              'mt-4 rounded-xl p-3 flex flex-wrap gap-2',
              critical ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100',
            ].join(' ')}>
              <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${critical ? 'text-red-500' : 'text-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold mb-1.5 ${critical ? 'text-red-700' : 'text-amber-700'}`}>
                  {ar ? `${warnings.length} تحذير يتطلب المراجعة` : `${warnings.length} flag${warnings.length > 1 ? 's' : ''} require attention`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {warnings.map((w) => {
                    const lbl = WARNING_LABELS[w];
                    return (
                      <span key={w} className={[
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        lbl?.critical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700',
                      ].join(' ')}>
                        {ar ? lbl?.ar : lbl?.en}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Verification review card (suppliers only) ────────────────────── */}
        {isSupplier && (
          <div className={[
            'card border-2',
            isPending  ? 'border-amber-200 bg-amber-50/50'  :
            isVerified ? 'border-emerald-200 bg-emerald-50/30' :
                         'border-red-200 bg-red-50/30',
          ].join(' ')}>
            {/* Status header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={[
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  isPending  ? 'bg-amber-100'  :
                  isVerified ? 'bg-emerald-100' : 'bg-red-100',
                ].join(' ')}>
                  {isPending  ? <Clock className="h-5 w-5 text-amber-600" />       :
                   isVerified ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> :
                                <XCircle className="h-5 w-5 text-red-500" />}
                </div>
                <div>
                  <p className={`text-sm font-bold ${isPending ? 'text-amber-800' : isVerified ? 'text-emerald-800' : 'text-red-700'}`}>
                    {isPending
                      ? (ar ? 'بانتظار مراجعة التوثيق' : 'Pending Verification Review')
                      : isVerified
                      ? (ar ? 'التوثيق مُعتمد' : 'Verification Approved')
                      : (ar ? 'التوثيق مرفوض' : 'Verification Rejected')}
                  </p>
                  {(company as any).verifiedAt && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {ar ? 'اعتُمد في' : 'Approved on'} {fmtDate((company as any).verifiedAt, locale)}
                    </p>
                  )}
                  {(company as any).verificationNotes && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      &quot;{(company as any).verificationNotes}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Revoke button for verified */}
              {isVerified && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                  onClick={() => setConfirmModal('revoke')}
                  loading={actionLoading === `reject-${company.id}`}
                >
                  {ar ? 'إلغاء التوثيق' : 'Revoke'}
                </Button>
              )}
            </div>

            {/* Approve / Reject actions for PENDING */}
            {isPending && (
              <div className="space-y-3 pt-3 border-t border-amber-200">
                {/* Approval note */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    {ar ? 'ملاحظة القبول (اختياري)' : 'Approval note (optional)'}
                  </label>
                  <input
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
                    placeholder={ar ? 'مثال: الوثائق مكتملة وصحيحة' : 'e.g. Documents complete and valid'}
                    className="input-base text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    loading={actionLoading === `approve-${company.id}`}
                    onClick={() => { onApprove(company.id, approveNote); setApproveNote(''); }}
                  >
                    {ar ? 'قبول وتوثيق' : 'Approve & Verify'}
                  </Button>

                  <Button
                    variant="danger"
                    className="flex-1"
                    icon={<XCircle className="h-4 w-4" />}
                    loading={actionLoading === `reject-${company.id}`}
                    onClick={() => setShowRejectField(!showRejectField)}
                  >
                    {ar ? 'رفض' : 'Reject'}
                  </Button>
                </div>

                {/* Reject reason field */}
                {showRejectField && (
                  <div className="space-y-2 pt-2 border-t border-red-200">
                    <label className="block text-xs font-medium text-red-700">
                      {ar ? 'سبب الرفض (مطلوب)' : 'Rejection reason (required)'}
                    </label>
                    <textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      rows={2}
                      className="input-base text-sm resize-none border-red-200 focus:border-red-400"
                      placeholder={ar ? 'أذكر سبب الرفض...' : 'Describe the reason for rejection...'}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full"
                      disabled={!rejectNote.trim()}
                      loading={actionLoading === `reject-${company.id}`}
                      onClick={() => {
                        if (rejectNote.trim()) {
                          onReject(company.id, rejectNote);
                          setRejectNote('');
                          setShowRejectField(false);
                        }
                      }}
                    >
                      {ar ? 'تأكيد الرفض' : 'Confirm Rejection'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Re-approve for rejected */}
            {isRejected && (
              <div className="pt-3 border-t border-red-200">
                <Button
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  loading={actionLoading === `approve-${company.id}`}
                  onClick={() => onApprove(company.id)}
                  className="w-full"
                >
                  {ar ? 'إعادة التوثيق' : 'Re-approve Verification'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Commercial Snapshot ──────────────────────────────────────────── */}
        <CommercialSnapshot company={company} ar={ar} locale={locale} />

        {/* ── Business information ─────────────────────────────────────────── */}
        <Section title={ar ? 'معلومات الشركة' : 'Business Information'} icon={<Building2 className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailField
              label={ar ? 'الاسم بالعربية' : 'Arabic Name'}
              value={company.nameAr}
            />
            <DetailField
              label={ar ? 'الاسم بالإنجليزية' : 'English Name'}
              value={company.nameEn}
            />
            {company.legalForm && (
              <DetailField label={ar ? 'الشكل القانوني' : 'Legal Form'} value={company.legalForm} />
            )}
            {company.establishmentYear && (
              <DetailField label={ar ? 'سنة التأسيس' : 'Established'} value={String(company.establishmentYear)} />
            )}
            {company.companySizeRange && (
              <DetailField label={ar ? 'حجم الشركة' : 'Company Size'} value={company.companySizeRange} />
            )}
            {company.contactJobTitle && (
              <DetailField label={ar ? 'المسمى الوظيفي' : 'Contact Title'} value={company.contactJobTitle} />
            )}
            {(company._count?.listings ?? 0) > 0 && (
              <DetailField
                label={ar ? 'عدد المنتجات' : 'Listed Products'}
                value={String(company._count!.listings)}
              />
            )}
            {(company._count?.rfqs ?? 0) > 0 && (
              <DetailField
                label={ar ? 'طلبات العروض' : 'RFQs Posted'}
                value={String(company._count!.rfqs)}
              />
            )}
          </div>

          {/* Sectors — full list in business section (non-clickable here, header has clickable ones) */}
          {company.sectors && company.sectors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">
                {ar ? 'القطاعات' : 'Sectors'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {company.sectors.map((s) => (
                  <FilterBadge
                    key={s}
                    title={ar ? 'بحث بهذا القطاع' : 'Search by sector'}
                    onClick={onFilterClick
                      ? () => onFilterClick({ search: s })
                      : undefined}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                  >
                    {s}
                  </FilterBadge>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ── Registration & Compliance ────────────────────────────────────── */}
        <Section title={ar ? 'التسجيل والامتثال' : 'Registration & Compliance'} icon={<ReceiptText className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                {ar ? 'رقم السجل التجاري' : 'Commercial Registration'}
              </p>
              <p className="text-sm font-bold text-slate-800 font-mono tracking-wide">{company.crNumber}</p>
            </div>

            {company.vatNumber && (
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                  {ar ? 'الرقم الضريبي (VAT)' : 'VAT Number'}
                </p>
                <p className="text-sm font-medium text-slate-800 font-mono">{company.vatNumber}</p>
              </div>
            )}

            {/* CR Expiry with status color */}
            {company.crExpiryDate && (
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                  {ar ? 'تاريخ انتهاء السجل' : 'CR Expiry Date'}
                </p>
                <p className={[
                  'text-sm font-semibold',
                  crDaysLeft !== null && crDaysLeft < 0    ? 'text-red-600' :
                  crDaysLeft !== null && crDaysLeft <= 30  ? 'text-amber-600' : 'text-slate-800',
                ].join(' ')}>
                  {fmtDate(company.crExpiryDate, locale)}
                  {crDaysLeft !== null && crDaysLeft < 0 && (
                    <span className="ms-1.5 text-[10px] font-bold bg-red-100 text-red-600 rounded px-1.5 py-0.5">
                      {ar ? 'منتهٍ' : 'EXPIRED'}
                    </span>
                  )}
                  {crDaysLeft !== null && crDaysLeft >= 0 && crDaysLeft <= 30 && (
                    <span className="ms-1.5 text-[10px] font-bold bg-amber-100 text-amber-600 rounded px-1.5 py-0.5">
                      {ar ? `ينتهي خلال ${crDaysLeft} يوم` : `${crDaysLeft}d left`}
                    </span>
                  )}
                </p>
              </div>
            )}

            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                {ar ? 'تاريخ التسجيل' : 'Registration Date'}
              </p>
              <p className="text-sm font-medium text-slate-800">{fmtDate(company.createdAt, locale)}</p>
            </div>
          </div>
        </Section>

        {/* ── Contact Details ──────────────────────────────────────────────── */}
        <Section title={ar ? 'معلومات التواصل' : 'Contact Details'} icon={<Phone className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {company.city ? (
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                    {ar ? 'المدينة' : 'City'}
                  </p>
                  <FilterBadge
                    title={ar ? 'بحث حسب المدينة' : 'Search by city'}
                    onClick={onFilterClick ? () => onFilterClick({ search: company.city! }) : undefined}
                    className="text-sm font-medium text-slate-800"
                  >
                    {company.city}
                  </FilterBadge>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic col-span-2">
                {ar ? 'المدينة غير محددة' : 'City not provided'}
              </p>
            )}

            {company.phone ? (
              <div className="flex items-start gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                    {ar ? 'الهاتف' : 'Phone'}
                  </p>
                  <p className="text-sm font-medium text-slate-800 font-mono">{company.phone}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-500 italic">
                {ar ? '⚠ رقم الهاتف مفقود' : '⚠ Phone number missing'}
              </p>
            )}

            {company.website && (
              <div className="flex items-start gap-2 col-span-2">
                <Globe className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">
                    {ar ? 'الموقع الإلكتروني' : 'Website'}
                  </p>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-600 hover:underline flex items-center gap-1"
                  >
                    {company.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ── Verification documents (suppliers only) ──────────────────────── */}
        {isSupplier && (
          <Section title={ar ? 'وثائق التحقق' : 'Verification Documents'} icon={<FileText className="h-4 w-4" />}>

            {/* Required docs checklist */}
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
                {ar ? 'قائمة الوثائق المطلوبة' : 'Required Documents Checklist'}
              </p>
              <div className="space-y-2">
                {REQUIRED_DOCS_CHECKLIST.map((item) => {
                  const uploaded = uploadedTypes.has(item.key);
                  return (
                    <div key={item.key} className="flex items-center gap-3">
                      <div className={[
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                        uploaded
                          ? 'bg-emerald-100 text-emerald-600'
                          : item.required
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-slate-100 text-slate-400',
                      ].join(' ')}>
                        {uploaded ? '✓' : item.required ? '!' : '○'}
                      </div>
                      <span className="text-sm text-slate-700">
                        {ar ? item.labelAr : item.labelEn}
                      </span>
                      <span className={[
                        'ms-auto text-[10px] font-medium rounded-full px-2 py-0.5',
                        uploaded
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.required
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-slate-100 text-slate-500',
                      ].join(' ')}>
                        {uploaded
                          ? (ar ? 'مُرفوع' : 'Uploaded')
                          : item.required
                          ? (ar ? 'مطلوب' : 'Required')
                          : (ar ? 'اختياري' : 'Optional')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Uploaded files */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
                {ar ? 'الملفات المرفوعة' : 'Uploaded Files'}
              </p>

              {!company.verificationDocs || company.verificationDocs.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">
                    {ar ? 'لم يُرفع أي مستند بعد' : 'No documents uploaded yet'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {ar
                      ? 'لا ينبغي اعتماد التوثيق قبل استلام الوثائق المطلوبة'
                      : 'Verification should not be approved until required documents are submitted'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {company.verificationDocs.map((doc) => (
                    <a
                      key={doc.id}
                      href={`http://localhost:3001${doc.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 hover:border-brand-200 hover:bg-brand-50/40 transition-all group"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700">
                          {ar
                            ? DOC_TYPE_LABELS[doc.type]?.ar || doc.type
                            : DOC_TYPE_LABELS[doc.type]?.en || doc.type}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {fmtDate(doc.uploadedAt, locale)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={[
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          doc.decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                          doc.decision === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                        'bg-amber-100 text-amber-600',
                        ].join(' ')}>
                          {doc.decision === 'APPROVED' ? (ar ? 'مقبول' : 'Approved') :
                           doc.decision === 'REJECTED' ? (ar ? 'مرفوض' : 'Rejected') :
                                                         (ar ? 'قيد المراجعة' : 'Pending')}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-600 transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Plan Management ───────────────────────────────────────────────── */}
        <Section title={ar ? 'إدارة الاشتراك' : 'Plan Management'} icon={<CreditCard className="h-4 w-4" />}>

          {company.plan === 'PRO' ? (
            <>
              {/* PRO plan — rich subscription info */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                    {ar ? 'الخطة الحالية' : 'Current Plan'}
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-100 px-3 py-1.5 text-sm font-bold text-purple-700">
                    <Zap className="h-3.5 w-3.5" />
                    PRO
                  </span>
                </div>
                {/* Subscription status badge */}
                <span className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${PLAN_STATUS_COLORS[planStatus.color]}`}>
                  {ar ? planStatus.labelAr : planStatus.labelEn}
                  {planStatus.key === 'expiring_soon' && planDaysLeft !== null && (
                    <span className="ms-1 opacity-75">({planDaysLeft}d)</span>
                  )}
                </span>
              </div>

              {/* Info rows */}
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <InfoRow
                  label={ar ? 'تاريخ انتهاء الاشتراك' : 'Expires On'}
                  value={
                    company.planExpiresAt ? (
                      <span className={
                        planStatus.key === 'expired'       ? 'text-red-600' :
                        planStatus.key === 'expiring_soon' ? 'text-amber-600' :
                        'text-slate-800'
                      }>
                        {fmtDate(company.planExpiresAt, locale)}
                      </span>
                    ) : (ar ? 'غير محدد' : 'No expiry set')
                  }
                />
                {/* Activation date — field not available in current schema */}
                {/* TODO: add planActivatedAt field to Company model */}
                <InfoRow
                  label={ar ? 'تاريخ التفعيل' : 'Activated On'}
                  unavailable
                />
                {/* Amount paid — requires Invoice relation in API response */}
                {/* TODO: include invoices in GET /companies?limit=200 response */}
                <InfoRow
                  label={ar ? 'المبلغ المدفوع' : 'Amount Paid'}
                  unavailable
                />
                <InfoRow
                  label={ar ? 'عدد المنتجات المدرجة' : 'Listed Products'}
                  value={String(company._count?.listings ?? 0)}
                />
              </div>

              {/* Downgrade action */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  {ar
                    ? 'تخفيض الخطة يُلغي مميزات PRO فوراً'
                    : 'Downgrading removes PRO features immediately'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={actionLoading === `plan-${company.id}`}
                  onClick={() => setConfirmModal('downgrade')}
                >
                  {ar ? 'تخفيض إلى FREE' : 'Downgrade to FREE'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* FREE plan — upgrade prompt */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                    {ar ? 'الخطة الحالية' : 'Current Plan'}
                  </p>
                  <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600">
                    FREE
                  </span>
                </div>
              </div>

              {/* Info rows for FREE */}
              <div className="rounded-xl border border-slate-100 overflow-hidden mb-4">
                <InfoRow
                  label={ar ? 'عدد المنتجات المدرجة' : 'Listed Products'}
                  value={String(company._count?.listings ?? 0)}
                />
                <InfoRow
                  label={ar ? 'الحصة الشهرية المستخدمة' : 'Monthly Quota Used'}
                  value={String(company.quotesUsedThisMonth ?? 0)}
                />
              </div>

              {/* PRO benefits note */}
              {isSupplier && (
                <div className="rounded-xl bg-purple-50 border border-purple-100 px-4 py-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-700 leading-relaxed">
                      {ar
                        ? 'ترقية إلى PRO تتيح إدراجاً غير محدود، وشارة "موثّق PRO" على الملف، وظهوراً أولياً في نتائج البحث.'
                        : 'Upgrading to PRO unlocks unlimited listings, a verified PRO badge, and priority placement in search results.'}
                    </p>
                  </div>
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                icon={<Zap className="h-3.5 w-3.5" />}
                loading={actionLoading === `plan-${company.id}`}
                onClick={() => onUpdatePlan(company.id, 'PRO')}
                className="w-full"
              >
                {ar ? 'ترقية إلى PRO' : 'Upgrade to PRO'}
              </Button>
            </>
          )}
        </Section>

        {/* ── Internal review notes ────────────────────────────────────────── */}
        <Section title={ar ? 'ملاحظات المراجعة الداخلية' : 'Internal Review Notes'} icon={<User className="h-4 w-4" />}>
          <p className="text-xs text-slate-400 mb-3">
            {ar
              ? 'هذه الملاحظات مرئية للمسؤولين فقط ولا تُعرض للمستخدمين'
              : 'Visible to admin team only — not shown to the company'}
          </p>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            className="input-base w-full text-sm resize-none"
            placeholder={ar
              ? 'أضف ملاحظات داخلية حول هذه الشركة، قرارات المراجعة، أو أي تنبيهات...'
              : 'Add internal notes, review decisions, or alerts about this company...'}
          />
          <div className="mt-3 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              loading={actionLoading === `notes-${company.id}`}
              onClick={() => onSaveNotes(company.id, notes)}
            >
              {ar ? 'حفظ الملاحظات' : 'Save Notes'}
            </Button>
          </div>
        </Section>

      </div>
    </>
  );
}
