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
  ChevronRight, Zap, ShieldCheck,
} from 'lucide-react';

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

  const isBuyer = user?.role === 'BUYER_ADMIN';
  const isSupplier = user?.role === 'SUPPLIER_ADMIN';
  const isAdmin = user?.role === 'PLATFORM_ADMIN';

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
        } else if (isSupplier) {
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
            totalRfqs: d.totalRfqs,
            openRfqs: d.openRfqs,
            totalDeals: d.totalDeals,
            totalListings: d.totalCompanies,
          });
        }
      } catch { /* silent */ }
    };
    fetchStats();
  }, [isBuyer, isSupplier, isAdmin]);

  const companyName = ar ? company?.nameAr : company?.nameEn;
  const quota = company?.plan === 'FREE' ? 3 : null;
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
                ? (isBuyer ? 'حساب مشترٍ' : isSupplier ? 'حساب مورّد' : 'إداري المنصة')
                : (isBuyer ? 'Buyer Account' : isSupplier ? 'Supplier Account' : 'Platform Admin')}
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
            {isSupplier && (
              <Link
                href={`${base}/supplier/listings/new`}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <Package className="h-4 w-4" />
                {ar ? 'إضافة منتج' : 'Add Listing'}
              </Link>
            )}
          </div>
        </div>

        {/* Supplier verification warning */}
        {isSupplier && company?.verificationStatus === 'PENDING' && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                {ar ? 'الحساب قيد المراجعة' : 'Account Pending Verification'}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {ar
                  ? 'يمكنك استعراض طلبات الأسعار لكن لا يمكنك تقديم عروض حتى يتم التحقق من شركتك.'
                  : 'You can browse RFQs but cannot submit quotes until your company is verified.'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<FileText className="h-5 w-5" />}
              label={ar ? 'إجمالي الطلبات' : 'Total RFQs'}
              value={stats.totalRfqs ?? '—'}
              sub={ar ? `${stats.openRfqs ?? 0} مفتوح` : `${stats.openRfqs ?? 0} open`}
              href={`${base}/buyer/rfqs`}
              color="brand"
            />
            <StatCard
              icon={<Briefcase className="h-5 w-5" />}
              label={ar ? 'صفقاتي' : 'My Deals'}
              value={stats.totalDeals ?? '—'}
              sub={ar ? `${stats.activeDeals ?? 0} نشط` : `${stats.activeDeals ?? 0} active`}
              href={`${base}/buyer/deals`}
              color="green"
            />
            <StatCard
              icon={<MessageSquare className="h-5 w-5" />}
              label={ar ? 'الرسائل' : 'Messages'}
              value="—"
              href={`${base}/messages`}
              color="purple"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label={ar ? 'موفّر بموازن' : 'Saved with Mwazn'}
              value="SAR —"
              color="amber"
            />
          </div>
        )}

        {isSupplier && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<ScrollText className="h-5 w-5" />}
              label={ar ? 'عروضي' : 'My Quotes'}
              value={stats.totalQuotes ?? '—'}
              sub={ar ? `${stats.pendingQuotes ?? 0} معلق` : `${stats.pendingQuotes ?? 0} pending`}
              href={`${base}/supplier/quotes`}
              color="brand"
            />
            <StatCard
              icon={<Briefcase className="h-5 w-5" />}
              label={ar ? 'صفقاتي' : 'My Deals'}
              value={stats.totalDeals ?? '—'}
              href={`${base}/supplier/deals`}
              color="green"
            />
            <StatCard
              icon={<Package className="h-5 w-5" />}
              label={ar ? 'منتجاتي' : 'My Listings'}
              value={stats.totalListings ?? '—'}
              href={`${base}/supplier/listings`}
              color="amber"
            />
            <StatCard
              icon={<MessageSquare className="h-5 w-5" />}
              label={ar ? 'الرسائل' : 'Messages'}
              value="—"
              href={`${base}/messages`}
              color="purple"
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
              label={ar ? 'إجمالي النشاط' : 'Platform Health'}
              value="100%"
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
              {isSupplier && [
                { href: `${base}/supplier/rfqs`, label: ar ? 'تصفح طلبات العروض' : 'Browse Open RFQs', icon: <FileText className="h-4 w-4" /> },
                { href: `${base}/supplier/quotes`, label: ar ? 'عروضي المقدمة' : 'My Submitted Quotes', icon: <ScrollText className="h-4 w-4" /> },
                { href: `${base}/supplier/listings/new`, label: ar ? 'إضافة منتج جديد' : 'Add New Listing', icon: <Package className="h-4 w-4" /> },
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
