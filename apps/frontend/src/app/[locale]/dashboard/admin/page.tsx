'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  Building2, FileText, Briefcase, Users, CheckCircle2, XCircle, Clock,
  Star, MessageSquare, ShieldCheck, Zap, AlertTriangle,
  ArrowRight, ChevronRight, Activity, BarChart3, Calendar, MapPin,
  CreditCard, TrendingUp, Package, ScrollText, Shield, Flag,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  companies: {
    total: number; buyers: number; suppliers: number;
    verified: number; pending: number; pro: number;
  };
  rfqs: { total: number; open: number };
  quotes: { total: number };
  deals: { total: number; active: number; completed: number };
  listings: { active: number };
  ratings: { total: number };
  financial: {
    gmv: number;
    pipeline: number;
    estimatedMonthlyRevenue: number;
    avgQuotesPerRFQ: number;
  };
  recentActivity: Array<{
    id: string; action: string; entity: string; entityId?: string;
    createdAt: string;
    user?: { fullName: string; email: string };
  }>;
}

interface PendingSupplier {
  id: string; nameAr: string; nameEn: string;
  crNumber: string; city?: string; createdAt: string;
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ icon, label, value, sub, color = 'brand', href, badge }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color?: string; href?: string; badge?: string;
}) {
  const ICON_BG: Record<string, string> = {
    brand:  'bg-brand-50 text-brand-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    blue:   'bg-blue-50 text-blue-600',
    teal:   'bg-teal-50 text-teal-600',
    rose:   'bg-rose-50 text-rose-600',
  };
  const BADGE_BG: Record<string, string> = {
    brand:  'bg-brand-100 text-brand-700',
    green:  'bg-emerald-100 text-emerald-700',
    amber:  'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
    blue:   'bg-blue-100 text-blue-700',
    teal:   'bg-teal-100 text-teal-700',
    rose:   'bg-rose-100 text-rose-700',
  };

  const inner = (
    <div className={[
      'card group relative overflow-hidden select-none',
      'transition-all duration-200',
      href ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : '',
    ].join(' ')}>
      {/* Hover glow overlay */}
      {href && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-brand-50/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
      )}

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${ICON_BG[color] || ICON_BG.brand}`}>
            {icon}
          </div>
          {href && (
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all duration-200" />
          )}
        </div>

        <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
        <p className="text-sm font-medium text-slate-500 mt-1.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sub}</p>}
        {badge && (
          <span className={`mt-2.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${BADGE_BG[color] || BADGE_BG.brand}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );

  return href
    ? <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-2xl">{inner}</Link>
    : inner;
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{title}</h2>
      <div className="flex-1 h-px bg-slate-100" />
      {action}
    </div>
  );
}

// ─── Pending item ─────────────────────────────────────────────────────────────

function PendingItem({
  company, locale, onVerify, onReject, verifyLoading, rejectLoading,
}: {
  company: PendingSupplier; locale: string;
  onVerify: () => void; onReject: () => void;
  verifyLoading: boolean; rejectLoading: boolean;
}) {
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;
  const reviewHref = `${base}/admin/companies/${company.id}`;

  return (
    <div className="group rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50/60 to-white px-4 py-3.5 hover:border-amber-200 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <Link href={reviewHref} className="shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold text-sm hover:bg-amber-200 transition-colors">
            {(ar ? company.nameAr : company.nameEn).charAt(0).toUpperCase()}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link href={reviewHref}>
            <p className="font-semibold text-slate-800 text-sm truncate hover:text-brand-700 transition-colors">
              {ar ? company.nameAr : company.nameEn}
            </p>
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-400">
            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded-md text-[10px] text-slate-500">
              {company.crNumber}
            </span>
            {company.city && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {company.city}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(company.createdAt).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            icon={<CheckCircle2 className="h-3 w-3" />}
            loading={verifyLoading}
            onClick={onVerify}
          >
            {ar ? 'توثيق' : 'Verify'}
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<XCircle className="h-3 w-3" />}
            loading={rejectLoading}
            onClick={onReject}
          >
            {ar ? 'رفض' : 'Reject'}
          </Button>
          <Link href={reviewHref}>
            <Button size="sm" variant="ghost" icon={<ChevronRight className="h-3.5 w-3.5" />}>
              {ar ? 'راجع' : 'Review'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Activity item ────────────────────────────────────────────────────────────

function ActivityItem({
  log, locale, base,
}: {
  log: DashboardData['recentActivity'][0]; locale: string; base: string;
}) {
  const ar = locale === 'ar';

  const isPositive = /verif|approv|complet/i.test(log.action);
  const isNegative = /reject|fail|cancel/i.test(log.action);

  // Route based on entity type
  const entity = log.entity?.toLowerCase() ?? '';
  const href = entity.includes('rfq') || entity.includes('quotation')
    ? (log.entityId ? `${base}/admin/rfqs/${log.entityId}` : `${base}/admin/rfqs`)
    : entity.includes('quote')
    ? `${base}/admin/quotes`
    : entity.includes('deal')
    ? `${base}/admin/deals`
    : entity.includes('rating')
    ? `${base}/admin/ratings`
    : log.entityId
    ? `${base}/admin/companies/${log.entityId}`
    : `${base}/admin/companies`;

  const dotColor = isPositive
    ? 'bg-emerald-100 text-emerald-700'
    : isNegative
    ? 'bg-red-100 text-red-600'
    : 'bg-brand-50 text-brand-600';

  const actionColor = isPositive ? 'text-emerald-700' : isNegative ? 'text-red-600' : 'text-brand-700';

  return (
    <Link
      href={href}
      className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
    >
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5 ${dotColor}`}>
        {(log.user?.fullName || log.entity || 'S').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 leading-snug">
          <span className={actionColor}>{log.action}</span>
          {' · '}
          <span className="text-slate-500">{log.entity}</span>
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {log.user?.fullName || 'System'}
          {' · '}
          {new Date(log.createdAt).toLocaleString(ar ? 'ar-SA' : 'en-SA', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-400 shrink-0 mt-0.5 transition-colors" />
    </Link>
  );
}

// ─── Quick link ───────────────────────────────────────────────────────────────

function QuickLink({
  href, icon, label, badge, color = 'brand',
}: {
  href: string; icon: React.ReactNode; label: string; badge?: number; color?: string;
}) {
  const HOVER: Record<string, string> = {
    brand:  'hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700',
    amber:  'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800',
    green:  'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800',
    purple: 'hover:border-purple-300 hover:bg-purple-50 hover:text-purple-800',
  };

  return (
    <Link
      href={href}
      className={[
        'flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3',
        'text-sm font-medium text-slate-600 cursor-pointer',
        'transition-all duration-150',
        HOVER[color] || HOVER.brand,
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
      ].join(' ')}
    >
      <span className="shrink-0 opacity-60">{icon}</span>
      <span className="flex-1 leading-tight">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold">
          {badge}
        </span>
      )}
      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-30" />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;

  const [data, setData] = useState<DashboardData | null>(null);
  const [pending, setPending] = useState<PendingSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [openAppealsCount, setOpenAppealsCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, moderationRes, appealsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/pending-verifications'),
        api.get('/admin/moderation', { params: { limit: 1 } }).catch(() => null),
        api.get('/admin/appeals', { params: { limit: 1, status: 'OPEN' } }).catch(() => null),
      ]);
      setData(statsRes.data.data);
      setPending(pendingRes.data.data?.items || pendingRes.data.data || []);
      if (moderationRes) setFlaggedCount(moderationRes.data.data?.meta?.total ?? 0);
      if (appealsRes) setOpenAppealsCount(appealsRes.data.data?.meta?.total ?? 0);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const verify = async (companyId: string, action: 'verify' | 'reject') => {
    setActionLoading(`${action}-${companyId}`);
    try {
      if (action === 'verify') {
        await api.patch(`/verification/admin/${companyId}/approve`);
      } else {
        await api.patch(`/verification/admin/${companyId}/reject`, {
          notes: 'Rejected from admin dashboard',
        });
      }
      await fetchData();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const today = new Date().toLocaleDateString(ar ? 'ar-SA' : 'en-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const pendingCount = data?.companies.pending ?? pending.length;

  return (
    <DashboardLayout>
      <div className="space-y-7">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {ar ? 'لوحة الإدارة' : 'Admin Dashboard'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {ar
                ? 'مركز التحكم · منصة موازن للتجارة B2B'
                : 'Platform command center · Mwazn B2B Marketplace'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {today}
            </span>
            <Link href={`${base}/admin/companies`}>
              <Button size="sm" icon={<Users className="h-4 w-4" />}>
                {ar ? 'إدارة الشركات' : 'Manage Companies'}
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Urgent alert banner ────────────────────────────────────────── */}
        {!loading && pendingCount > 0 && (
          <Link
            href={`${base}/admin/companies?type=SUPPLIER&status=PENDING`}
            className="block"
          >
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 hover:bg-amber-100/70 hover:border-amber-300 transition-all cursor-pointer group">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="flex-1 text-sm font-medium text-amber-800">
                {ar
                  ? `${pendingCount} مورّد${pendingCount > 1 ? 'ون' : ''} بانتظار مراجعة التوثيق — يتطلب إجراء`
                  : `${pendingCount} supplier${pendingCount > 1 ? 's' : ''} pending verification — action required`}
              </p>
              <span className="text-xs font-bold text-amber-700 group-hover:underline shrink-0">
                {ar ? 'مراجعة الآن ←' : 'Review now →'}
              </span>
            </div>
          </Link>
        )}

        {/* ── Loading skeleton ─────────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            {/* ── Company metrics ──────────────────────────────────────────── */}
            <div>
              <SectionHeader
                title={ar ? 'الشركات' : 'Companies'}
                action={
                  <Link
                    href={`${base}/admin/companies`}
                    className="text-xs text-brand-600 hover:underline font-medium shrink-0"
                  >
                    {ar ? 'عرض الكل' : 'View all'}
                  </Link>
                }
              />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  icon={<Building2 className="h-5 w-5" />}
                  label={ar ? 'إجمالي الشركات' : 'Total Companies'}
                  value={data.companies.total}
                  sub={ar
                    ? `${data.companies.buyers} مشترٍ · ${data.companies.suppliers} مورّد`
                    : `${data.companies.buyers} buyers · ${data.companies.suppliers} suppliers`}
                  color="brand"
                  href={`${base}/admin/companies`}
                  badge={ar ? 'عرض الكل' : 'All companies'}
                />
                <MetricCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  label={ar ? 'موردون موثّقون' : 'Verified Suppliers'}
                  value={data.companies.verified}
                  sub={ar ? 'اضغط لعرض الموردين الموثّقين' : 'Click to filter verified'}
                  color="green"
                  href={`${base}/admin/companies?type=SUPPLIER&status=VERIFIED`}
                  badge={ar ? 'موثّق ✓' : 'Verified'}
                />
                <MetricCard
                  icon={<Clock className="h-5 w-5" />}
                  label={ar ? 'بانتظار التوثيق' : 'Pending Review'}
                  value={data.companies.pending}
                  sub={ar
                    ? `${(data.companies as any).rejected ?? 0} مرفوض · يتطلب مراجعة`
                    : `${(data.companies as any).rejected ?? 0} rejected · needs review`}
                  color="amber"
                  href={`${base}/admin/companies?type=SUPPLIER&status=PENDING`}
                  badge={data.companies.pending > 0 ? (ar ? 'عاجل' : 'Urgent') : undefined}
                />
                <MetricCard
                  icon={<Zap className="h-5 w-5" />}
                  label={ar ? 'موردو PRO' : 'PRO Suppliers'}
                  value={data.companies.pro}
                  sub={ar ? 'اضغط لعرض المشتركين في PRO' : 'Click to view PRO plan'}
                  color="purple"
                  href={`${base}/admin/companies?plan=PRO`}
                  badge="PRO"
                />
              </div>
            </div>

            {/* ── Platform activity metrics ─────────────────────────────────── */}
            <div>
              <SectionHeader title={ar ? 'نشاط المنصة' : 'Platform Activity'} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  icon={<FileText className="h-5 w-5" />}
                  label={ar ? 'طلبات الأسعار' : 'Total RFQs'}
                  value={data.rfqs.total}
                  sub={ar ? `${data.rfqs.open} مفتوح حالياً` : `${data.rfqs.open} currently open`}
                  color="blue"
                  href={`${base}/admin/rfqs`}
                  badge={ar ? 'عرض الكل' : 'View all'}
                />
                <MetricCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  label={ar ? 'عروض الأسعار' : 'Total Quotes'}
                  value={data.quotes.total}
                  sub={ar ? 'إجمالي العروض المقدّمة' : 'Total quotes submitted'}
                  color="brand"
                  href={`${base}/admin/quotes`}
                  badge={ar ? 'عرض الكل' : 'View all'}
                />
                <MetricCard
                  icon={<Briefcase className="h-5 w-5" />}
                  label={ar ? 'الصفقات' : 'Deals'}
                  value={data.deals.total}
                  sub={ar
                    ? `${data.deals.completed} مكتملة · ${data.deals.active} نشطة · ${(data.deals as any).cancelled ?? 0} ملغاة`
                    : `${data.deals.completed} completed · ${data.deals.active} active · ${(data.deals as any).cancelled ?? 0} cancelled`}
                  color="teal"
                  href={`${base}/admin/deals`}
                  badge={ar ? 'عرض الكل' : 'View all'}
                />
                <MetricCard
                  icon={<Star className="h-5 w-5" />}
                  label={ar ? 'التقييمات' : 'Ratings'}
                  value={data.ratings.total}
                  sub={ar ? 'إجمالي التقييمات المنشورة' : 'Total ratings submitted'}
                  color="rose"
                  href={`${base}/admin/ratings`}
                  badge={ar ? 'عرض الكل' : 'View all'}
                />
              </div>
            </div>

            {/* ── Moderation ───────────────────────────────────────────────── */}
            <div>
              <SectionHeader title={ar ? 'الإشراف على المحتوى' : 'Content Moderation'} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                  icon={<Shield className="h-5 w-5" />}
                  label={ar ? 'محتوى مُعلَّق / محذوف' : 'Flagged / Removed Content'}
                  value={flaggedCount}
                  sub={ar ? 'طلبات أسعار ومنتجات تحت المراجعة' : 'RFQs & listings under review'}
                  color="amber"
                  href={`${base}/admin/moderation`}
                  badge={flaggedCount > 0 ? (ar ? 'يتطلب مراجعة' : 'Needs review') : undefined}
                />
                <MetricCard
                  icon={<Flag className="h-5 w-5" />}
                  label={ar ? 'الاعتراضات المفتوحة' : 'Open Appeals'}
                  value={openAppealsCount}
                  sub={ar ? 'اعتراضات المستخدمين بانتظار الرد' : 'User appeals awaiting review'}
                  color="blue"
                  href={`${base}/admin/appeals`}
                  badge={openAppealsCount > 0 ? (ar ? 'عاجل' : 'Urgent') : undefined}
                />
                <MetricCard
                  icon={<Package className="h-5 w-5" />}
                  label={ar ? 'إدارة المنتجات' : 'Manage Listings'}
                  value={data.listings.active}
                  sub={ar ? 'جميع منتجات الموردين' : 'All supplier listings'}
                  color="purple"
                  href={`${base}/admin/listings`}
                  badge={ar ? 'عرض الكل' : 'View all'}
                />
              </div>
            </div>

            {/* ── Commercial Intelligence ──────────────────────────────────── */}
            {data.financial && (
              <div>
                <SectionHeader title={ar ? 'المؤشرات التجارية' : 'Commercial Intelligence'} />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    icon={<TrendingUp className="h-5 w-5" />}
                    label={ar ? 'حجم السوق الإجمالي (GMV)' : 'Gross Marketplace Volume (GMV)'}
                    value={`${(data.financial.gmv / 1_000_000).toFixed(1)}M SAR`}
                    sub={ar ? 'مجموع قيمة الصفقات المكتملة' : 'Sum of all completed deal values'}
                    color="green"
                  />
                  <MetricCard
                    icon={<Briefcase className="h-5 w-5" />}
                    label={ar ? 'خط أنابيب الصفقات النشطة' : 'Active Deal Pipeline'}
                    value={`${(data.financial.pipeline / 1_000_000).toFixed(1)}M SAR`}
                    sub={ar ? 'صفقات مُرساة وقيد التنفيذ' : 'Awarded + in-progress deals'}
                    color="blue"
                  />
                  <MetricCard
                    icon={<CreditCard className="h-5 w-5" />}
                    label={ar ? 'الإيراد الشهري المتوقع' : 'Estimated Monthly Revenue'}
                    value={`${data.financial.estimatedMonthlyRevenue.toLocaleString()} SAR`}
                    sub={ar
                      ? `${data.companies.pro} مورّد PRO × 299 SAR`
                      : `${data.companies.pro} PRO suppliers × 299 SAR`}
                    color="purple"
                    href={`${base}/admin/companies?plan=PRO`}
                  />
                  <MetricCard
                    icon={<MessageSquare className="h-5 w-5" />}
                    label={ar ? 'متوسط العروض لكل طلب' : 'Avg Quotes per RFQ'}
                    value={data.financial.avgQuotesPerRFQ}
                    sub={ar ? 'مؤشر تنافسية المنصة' : 'Platform competitiveness indicator'}
                    color="teal"
                  />
                </div>
              </div>
            )}

            {/* ── Bottom split: Pending + Activity ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Pending Verifications */}
              <div className="card">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="font-semibold text-slate-800">
                      {ar ? 'موردون بانتظار التوثيق' : 'Pending Verifications'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ar
                        ? 'مطلوب مراجعة الوثائق وإصدار القرار'
                        : 'Document review and decision required'}
                    </p>
                  </div>
                  {pending.length > 0 && (
                    <span className="inline-flex items-center rounded-xl bg-amber-100 text-amber-700 px-2.5 py-1 text-xs font-bold">
                      {pending.length}
                    </span>
                  )}
                </div>

                {pending.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 mb-3">
                      <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                    </div>
                    <p className="font-semibold text-slate-700">{ar ? 'القائمة نظيفة' : 'All clear'}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {ar ? 'لا توجد طلبات توثيق معلقة' : 'No pending verification requests'}
                    </p>
                    <Link
                      href={`${base}/admin/companies?type=SUPPLIER`}
                      className="mt-3 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline font-medium"
                    >
                      {ar ? 'عرض جميع الموردين' : 'View all suppliers'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pending.slice(0, 5).map((company) => (
                      <PendingItem
                        key={company.id}
                        company={company}
                        locale={locale}
                        onVerify={() => verify(company.id, 'verify')}
                        onReject={() => verify(company.id, 'reject')}
                        verifyLoading={actionLoading === `verify-${company.id}`}
                        rejectLoading={actionLoading === `reject-${company.id}`}
                      />
                    ))}

                    {pending.length > 5 && (
                      <Link
                        href={`${base}/admin/companies?type=SUPPLIER&status=PENDING`}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-amber-200 py-2.5 text-sm text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-colors font-medium mt-1"
                      >
                        {ar ? `عرض كل الـ ${pending.length} طلب` : `View all ${pending.length} pending`}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="card">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="font-semibold text-slate-800">
                      {ar ? 'آخر النشاطات' : 'Recent Activity'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ar ? 'آخر الأحداث والإجراءات على المنصة' : 'Latest platform events and actions'}
                    </p>
                  </div>
                  <Activity className="h-4 w-4 text-slate-300 shrink-0" />
                </div>

                {data.recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                      <Activity className="h-7 w-7 text-slate-400" />
                    </div>
                    <p className="font-semibold text-slate-700">
                      {ar ? 'لا يوجد نشاط مسجّل بعد' : 'No recorded activity yet'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1.5 max-w-[280px] leading-relaxed">
                      {ar
                        ? 'الإجراءات الإدارية كالتحقق من الموردين وتغيير خطط الاشتراك ستظهر هنا'
                        : 'Admin actions like verifying suppliers and changing subscription plans will appear here'}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-sm">
                      <Link href={`${base}/admin/audit`}>
                        <Button size="sm" variant="secondary" icon={<ScrollText className="h-3.5 w-3.5" />} className="w-full">
                          {ar ? 'سجل التدقيق' : 'Audit Log'}
                        </Button>
                      </Link>
                      <Link href={`${base}/admin/companies`}>
                        <Button size="sm" variant="ghost" icon={<Users className="h-3.5 w-3.5" />} className="w-full">
                          {ar ? 'الشركات' : 'Companies'}
                        </Button>
                      </Link>
                      <Link href={`${base}/admin/rfqs`}>
                        <Button size="sm" variant="ghost" icon={<FileText className="h-3.5 w-3.5" />} className="w-full">
                          {ar ? 'طلبات الأسعار' : 'RFQs'}
                        </Button>
                      </Link>
                      <Link href={`${base}/admin/deals`}>
                        <Button size="sm" variant="ghost" icon={<Briefcase className="h-3.5 w-3.5" />} className="w-full">
                          {ar ? 'الصفقات' : 'Deals'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="-mx-2 space-y-0.5">
                      {data.recentActivity.slice(0, 8).map((log) => (
                        <ActivityItem key={log.id} log={log} locale={locale} base={base} />
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex gap-3 justify-center flex-wrap">
                      <Link
                        href={`${base}/admin/rfqs`}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
                      >
                        {ar ? 'طلبات الأسعار' : 'RFQs'}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      <span className="text-slate-200">·</span>
                      <Link
                        href={`${base}/admin/deals`}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
                      >
                        {ar ? 'الصفقات' : 'Deals'}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      <span className="text-slate-200">·</span>
                      <Link
                        href={`${base}/admin/companies`}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
                      >
                        {ar ? 'الشركات' : 'Companies'}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      <span className="text-slate-200">·</span>
                      <Link
                        href={`${base}/admin/audit`}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium hover:underline"
                      >
                        {ar ? 'سجل التدقيق' : 'Audit Log'}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Quick Actions ─────────────────────────────────────────────── */}
            <div>
              <SectionHeader title={ar ? 'إجراءات سريعة' : 'Quick Actions'} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <QuickLink
                  href={`${base}/admin/companies`}
                  icon={<Users className="h-4 w-4" />}
                  label={ar ? 'إدارة جميع الشركات' : 'Manage All Companies'}
                  color="brand"
                />
                <QuickLink
                  href={`${base}/admin/companies?type=SUPPLIER&status=PENDING`}
                  icon={<Clock className="h-4 w-4" />}
                  label={ar ? 'مراجعة طلبات التوثيق' : 'Review Pending Verifications'}
                  badge={data.companies.pending}
                  color="amber"
                />
                <QuickLink
                  href={`${base}/admin/moderation`}
                  icon={<Shield className="h-4 w-4" />}
                  label={ar ? 'قائمة الإشراف' : 'Moderation Queue'}
                  badge={flaggedCount}
                  color="amber"
                />
                <QuickLink
                  href={`${base}/admin/appeals`}
                  icon={<Flag className="h-4 w-4" />}
                  label={ar ? 'الاعتراضات المفتوحة' : 'Open Appeals'}
                  badge={openAppealsCount}
                  color="brand"
                />
                <QuickLink
                  href={`${base}/admin/rfqs`}
                  icon={<FileText className="h-4 w-4" />}
                  label={ar ? 'طلبات الأسعار' : 'Browse RFQs'}
                  color="brand"
                />
                <QuickLink
                  href={`${base}/admin/listings`}
                  icon={<Package className="h-4 w-4" />}
                  label={ar ? 'إدارة المنتجات' : 'Manage Listings'}
                  color="purple"
                />
                <QuickLink
                  href={`${base}/admin/deals`}
                  icon={<Briefcase className="h-4 w-4" />}
                  label={ar ? 'الصفقات النشطة' : 'Active Deals'}
                  color="green"
                />
                <QuickLink
                  href={`${base}/admin/audit`}
                  icon={<ScrollText className="h-4 w-4" />}
                  label={ar ? 'سجل التدقيق' : 'Audit Log'}
                  color="purple"
                />
              </div>
            </div>

          </>
        )}
      </div>
    </DashboardLayout>
  );
}
