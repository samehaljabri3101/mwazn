'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import {
  FileText, Briefcase, Package, ScrollText,
  MessageSquare, TrendingUp, Clock, CheckCircle2,
  ChevronRight, Zap, ShieldCheck, X,
} from 'lucide-react';

function OnboardingChecklist({
  isBuyer,
  isSupplier,
  stats,
  ar,
  base,
}: {
  isBuyer: boolean;
  isSupplier: boolean;
  stats: StatsData;
  ar: boolean;
  base: string;
}) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mwazn_onboarding_done') === '1';
    }
    return false;
  });

  if (dismissed) return null;

  const buyerSteps = [
    { labelEn: 'Create account', labelAr: 'إنشاء حساب', done: true, href: '' },
    { labelEn: 'Complete profile', labelAr: 'إكمال الملف الشخصي', done: false, href: `${base}/profile` },
    { labelEn: 'Post first RFQ', labelAr: 'نشر أول طلب', done: (stats.totalRfqs ?? 0) > 0, href: `${base}/buyer/rfqs/new` },
    { labelEn: 'Accept a quote', labelAr: 'قبول عرض سعر', done: (stats.totalDeals ?? 0) > 0, href: `${base}/buyer/rfqs` },
  ];

  const supplierSteps = [
    { labelEn: 'Create account', labelAr: 'إنشاء حساب', done: true, href: '' },
    { labelEn: 'Complete profile', labelAr: 'إكمال الملف الشخصي', done: false, href: `${base}/profile` },
    { labelEn: 'Add a product', labelAr: 'إضافة منتج', done: (stats.totalListings ?? 0) > 0, href: `${base}/supplier/listings/new` },
    { labelEn: 'Submit first quote', labelAr: 'تقديم أول عرض', done: (stats.totalQuotes ?? 0) > 0, href: `${base}/supplier/rfqs` },
  ];

  const steps = isBuyer ? buyerSteps : supplierSteps;
  const completed = steps.filter((s) => s.done).length;

  if (completed === steps.length) {
    localStorage.setItem('mwazn_onboarding_done', '1');
    return null;
  }

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-brand-800 text-sm">
            {ar ? 'دليل البدء' : 'Getting Started'} — {completed}/{steps.length} {ar ? 'مكتمل' : 'complete'}
          </h3>
          <div className="mt-1.5 h-1.5 w-48 rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-brand-700 transition-all"
              style={{ width: `${(completed / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => { localStorage.setItem('mwazn_onboarding_done', '1'); setDismissed(true); }}
          className="text-brand-400 hover:text-brand-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {steps.map((step, i) => (
          step.href ? (
            <Link
              key={i}
              href={step.href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition-all ${
                step.done
                  ? 'text-green-700 bg-green-50'
                  : 'text-brand-700 bg-white border border-brand-100 hover:border-brand-300'
              }`}
            >
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${step.done ? 'text-green-500' : 'text-slate-200'}`} />
              {ar ? step.labelAr : step.labelEn}
            </Link>
          ) : (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs bg-green-50 text-green-700"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              {ar ? step.labelAr : step.labelEn}
            </div>
          )
        ))}
      </div>
    </div>
  );
}

interface StatsData {
  totalRfqs?: number;
  openRfqs?: number;
  totalDeals?: number;
  activeDeals?: number;
  totalQuotes?: number;
  pendingQuotes?: number;
  totalListings?: number;
  unreadMessages?: number;
}

function StatCard({
  icon, label, value, sub, href, color = 'brand',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  color?: 'brand' | 'green' | 'amber' | 'purple';
}) {
  const colors = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  const inner = (
    <div className="card flex items-start gap-4 hover:shadow-card-hover transition-shadow">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colors[color]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      {href && <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-1" />}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const locale = useLocale();
  const { user, company } = useAuth();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;

  const [stats, setStats] = useState<StatsData>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const isAdmin = user?.role === 'PLATFORM_ADMIN';
  const isSeller = user?.role === 'SUPPLIER_ADMIN' || user?.role === 'FREELANCER';
  const isBuyer = user?.role === 'BUYER_ADMIN' || user?.role === 'CUSTOMER';
  const isSupplier = user?.role === 'SUPPLIER_ADMIN'; // legacy compat (for PRO quota / CR warning)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isBuyer) {
          const [rfqsRes, dealsRes] = await Promise.all([
            api.get('/rfqs/my', { params: { limit: 1 } }),
            api.get('/deals', { params: { limit: 1 } }),
          ]);
          setStats({
            totalRfqs: rfqsRes.data.data?.meta?.total ?? 0,
            openRfqs: rfqsRes.data.data?.items?.filter((r: any) => r.status === 'OPEN').length ?? 0,
            totalDeals: dealsRes.data.data?.meta?.total ?? 0,
            activeDeals: dealsRes.data.data?.items?.filter((d: any) => ['AWARDED', 'IN_PROGRESS'].includes(d.status)).length ?? 0,
          });
        } else if (isSeller) {
          const [quotesRes, dealsRes, listingsRes] = await Promise.all([
            api.get('/quotes/my', { params: { limit: 1 } }),
            api.get('/deals', { params: { limit: 1 } }),
            api.get('/listings', { params: { limit: 1 } }),
          ]);
          setStats({
            totalQuotes: quotesRes.data.data?.meta?.total ?? 0,
            pendingQuotes: quotesRes.data.data?.items?.filter((q: any) => q.status === 'PENDING').length ?? 0,
            totalDeals: dealsRes.data.data?.meta?.total ?? 0,
            totalListings: listingsRes.data.data?.meta?.total ?? 0,
          });
        } else if (isAdmin) {
          const res = await api.get('/admin/dashboard');
          const d = res.data.data;
          setStats({
            totalRfqs: d.rfqs?.total,
            openRfqs: d.rfqs?.open,
            totalDeals: d.deals?.total,
            totalListings: d.listings?.active,
          });
        }
      } catch { /* silent */ }
    };
    fetchStats();
  }, [isBuyer, isSeller, isAdmin]);

  const companyName = ar ? company?.nameAr : company?.nameEn;
  const quota = company?.plan === 'FREE' ? 10 : null;
  const quotaUsed = company?.quotesUsedThisMonth ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {ar ? `مرحباً، ${user?.fullName?.split(' ')[0]}` : `Welcome back, ${user?.fullName?.split(' ')[0]}`}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {companyName} &bull; {ar
                ? (isBuyer ? 'حساب مشترٍ' : isSeller ? 'حساب مورّد' : 'إداري المنصة')
                : (isBuyer ? 'Buyer Account' : isSeller ? 'Supplier Account' : 'Platform Admin')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isBuyer && (
              <Link
                href={`${base}/buyer/rfqs/new`}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <FileText className="h-4 w-4" />
                {ar ? 'طلب عرض سعر جديد' : 'New RFQ'}
              </Link>
            )}
            {isSeller && (
              <Link
                href={`${base}/supplier/listings/new`}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <Package className="h-4 w-4" />
                {ar ? 'إضافة منتج' : 'Add Product'}
              </Link>
            )}
          </div>
        </div>

        {/* Onboarding checklist */}
        {(isBuyer || isSeller) && (
          <OnboardingChecklist
            isBuyer={isBuyer}
            isSupplier={isSeller}
            stats={stats}
            ar={ar}
            base={base}
          />
        )}

        {/* Supplier verification warning */}
        {isSupplier && company?.verificationStatus === 'PENDING' && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                {ar ? 'السجل التجاري قيد المراجعة' : 'CR Document Under Review'}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {ar
                  ? 'فريقنا يراجع مستندات السجل التجاري. يمكنك استعراض الطلبات الآن وتقديم العروض فور اكتمال التحقق (عادةً خلال 24 ساعة).'
                  : 'Our team is reviewing your CR documents. You can browse RFQs now and submit quotes once verification is complete (usually within 24 hours).'}
              </p>
            </div>
          </div>
        )}

        {/* FREE quota banner */}
        {isSupplier && company?.plan === 'FREE' && company?.verificationStatus === 'VERIFIED' && (
          <div className="rounded-2xl bg-brand-50 border border-brand-100 px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-brand-700" />
              <div>
                <p className="font-semibold text-brand-800 text-sm">
                  {ar ? `استخدمت ${quotaUsed} من ${quota} عروض هذا الشهر` : `${quotaUsed} of ${quota} quotes used this month`}
                </p>
                <div className="mt-1.5 h-1.5 w-48 rounded-full bg-brand-100">
                  <div
                    className="h-full rounded-full bg-brand-700 transition-all"
                    style={{ width: `${Math.min((quotaUsed / (quota ?? 3)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <Link
              href={`${base}/subscription`}
              className="btn-primary text-xs whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5" />
              {ar ? 'الترقية لـ PRO' : 'Upgrade to PRO'}
            </Link>
          </div>
        )}

        {/* Stat cards */}
        {isBuyer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              icon={<FileText className="h-5 w-5" />}
              label={ar ? 'طلبات عروضي' : 'My RFQs'}
              value={stats.totalRfqs ?? '—'}
              sub={(stats.openRfqs ?? 0) > 0
                ? (ar ? `${stats.openRfqs} مفتوح — ينتظر عروض` : `${stats.openRfqs} open — awaiting quotes`)
                : (ar ? 'لا يوجد مفتوح' : 'None open')}
              href={`${base}/buyer/rfqs`}
              color="brand"
            />
            <StatCard
              icon={<Briefcase className="h-5 w-5" />}
              label={ar ? 'صفقاتي' : 'My Deals'}
              value={stats.totalDeals ?? '—'}
              sub={(stats.activeDeals ?? 0) > 0
                ? (ar ? `${stats.activeDeals} نشط` : `${stats.activeDeals} in progress`)
                : (ar ? 'لا توجد صفقات نشطة' : 'No active deals')}
              href={`${base}/buyer/deals`}
              color="green"
            />
          </div>
        )}

        {isSeller && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<ScrollText className="h-5 w-5" />}
              label={ar ? 'عروضي' : 'My Quotes'}
              value={stats.totalQuotes ?? '—'}
              sub={(stats.pendingQuotes ?? 0) > 0
                ? (ar ? `${stats.pendingQuotes} تحتاج متابعة` : `${stats.pendingQuotes} need attention`)
                : (ar ? 'لا يوجد معلق' : 'None pending')}
              href={`${base}/supplier/quotes`}
              color="brand"
            />
            <StatCard
              icon={<Briefcase className="h-5 w-5" />}
              label={ar ? 'صفقاتي' : 'My Deals'}
              value={stats.totalDeals ?? '—'}
              sub={ar ? 'صفقات نشطة ومنجزة' : 'Active & completed'}
              href={`${base}/supplier/deals`}
              color="green"
            />
            <StatCard
              icon={<Package className="h-5 w-5" />}
              label={ar ? 'منتجاتي' : 'My Products'}
              value={stats.totalListings ?? '—'}
              sub={ar ? 'منتجات في الكتالوج' : 'Listed in catalog'}
              href={`${base}/supplier/listings`}
              color="amber"
            />
          </div>
        )}

        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<FileText className="h-5 w-5" />}
              label={ar ? 'طلبات العروض' : 'Total RFQs'}
              value={stats.totalRfqs ?? '—'}
              sub={ar ? `${stats.openRfqs ?? 0} مفتوح` : `${stats.openRfqs ?? 0} open`}
              color="brand"
            />
            <StatCard
              icon={<Briefcase className="h-5 w-5" />}
              label={ar ? 'الصفقات' : 'Total Deals'}
              value={stats.totalDeals ?? '—'}
              color="green"
            />
            <StatCard
              icon={<ShieldCheck className="h-5 w-5" />}
              label={ar ? 'الشركات' : 'Companies'}
              value={stats.totalListings ?? '—'}
              href={`${base}/admin/companies`}
              color="purple"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label={ar ? 'طلبات العروض المفتوحة' : 'Open RFQs'}
              value={stats.openRfqs ?? '—'}
              color="amber"
            />
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick links */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">
              {ar ? 'وصول سريع' : 'Quick Access'}
            </h3>
            <div className="space-y-2">
              {isBuyer && [
                { href: `${base}/buyer/rfqs/new`, label: ar ? 'إنشاء طلب عرض سعر' : 'Create New RFQ', icon: <FileText className="h-4 w-4" /> },
                { href: `${base}/buyer/rfqs`, label: ar ? 'استعراض طلباتي' : 'View My RFQs', icon: <FileText className="h-4 w-4" /> },
                { href: `${base}/buyer/deals`, label: ar ? 'متابعة الصفقات' : 'Track Deals', icon: <Briefcase className="h-4 w-4" /> },
                { href: `${locale}/suppliers`, label: ar ? 'تصفح الموردين' : 'Browse Suppliers', icon: <ShieldCheck className="h-4 w-4" /> },
              ].map((item) => (
                <Link key={item.href} href={`/${item.href.startsWith('/') ? item.href.slice(1) : item.href}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors">
                  <span className="text-brand-600">{item.icon}</span>
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 ms-auto rtl-mirror" />
                </Link>
              ))}
              {isSeller && [
                { href: `${base}/supplier/rfqs`, label: ar ? 'تصفح طلبات العروض' : 'Browse Open RFQs', icon: <FileText className="h-4 w-4" /> },
                { href: `${base}/supplier/quotes`, label: ar ? 'عروضي المقدمة' : 'My Submitted Quotes', icon: <ScrollText className="h-4 w-4" /> },
                { href: `${base}/supplier/listings/new`, label: ar ? 'إضافة منتج جديد' : 'Add New Product', icon: <Package className="h-4 w-4" /> },
                { href: `${base}/supplier/deals`, label: ar ? 'صفقاتي' : 'My Deals', icon: <Briefcase className="h-4 w-4" /> },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors">
                  <span className="text-brand-600">{item.icon}</span>
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 ms-auto rtl-mirror" />
                </Link>
              ))}
              {isAdmin && [
                { href: `${base}/admin/companies`, label: ar ? 'إدارة الشركات' : 'Manage Companies', icon: <ShieldCheck className="h-4 w-4" /> },
                { href: `${base}/admin`, label: ar ? 'لوحة التحكم' : 'Admin Dashboard', icon: <TrendingUp className="h-4 w-4" /> },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors">
                  <span className="text-brand-600">{item.icon}</span>
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 ms-auto rtl-mirror" />
                </Link>
              ))}
            </div>
          </div>

          {/* Company info */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">
              {ar ? 'معلومات الشركة' : 'Company Info'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 font-bold text-lg">
                  {(company?.nameEn || company?.nameAr || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{ar ? company?.nameAr : company?.nameEn}</p>
                  <p className="text-xs text-slate-400">CR: {company?.crNumber}</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {[
                  { label: ar ? 'المدينة' : 'City', value: company?.city || '—' },
                  { label: ar ? 'الخطة' : 'Plan', value: company?.plan || 'FREE' },
                  { label: ar ? 'الحالة' : 'Status', value: company?.verificationStatus || 'PENDING' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{row.label}</span>
                    <span className="font-medium text-slate-800">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
