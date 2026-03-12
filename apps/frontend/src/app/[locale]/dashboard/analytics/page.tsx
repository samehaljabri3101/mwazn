'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  TrendingUp, Package, Star, DollarSign, FileText, CheckCircle2,
  XCircle, Trophy, BarChart2, Eye, Zap, Download, ShieldCheck,
} from 'lucide-react';

// Simple bar chart using Tailwind CSS — no external libs
function BarChart({ data, color = 'brand' }: {
  data: { label: string; count: number }[];
  color?: 'brand' | 'green' | 'purple';
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const colorMap = {
    brand: 'bg-brand-600',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  };
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d) => (
        <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] text-slate-500">{d.count || ''}</span>
          <div
            className={`w-full rounded-t-md transition-all ${colorMap[color]}`}
            style={{ height: `${Math.max((d.count / max) * 80, d.count > 0 ? 4 : 0)}px` }}
          />
          <span className="text-[10px] text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = 'brand' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className="card">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${colors[color] || colors.brand}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const locale = useLocale();
  const { user, company } = useAuth();
  const ar = locale === 'ar';
  const isAdmin = user?.role === 'PLATFORM_ADMIN';
  const isSupplier = user?.role === 'SUPPLIER_ADMIN';
  const isBuyer = user?.role === 'BUYER_ADMIN';
  const isPro = company?.plan === 'PRO';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isAdmin) { setLoading(false); return; }
    const endpoint = isSupplier ? '/analytics/supplier' : '/analytics/buyer';
    api.get(endpoint).then((res) => {
      setData(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isSupplier, isAdmin]);

  const handleExport = async () => {
    if (!isPro) return;
    setExporting(true);
    try {
      const endpoint = isSupplier ? '/analytics/supplier/export' : '/analytics/buyer/export';
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `mwazn-analytics-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    setExporting(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {ar ? 'التحليلات' : 'Analytics'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {ar ? 'مؤشرات الأداء لنشاطك التجاري' : 'Business performance insights'}
            </p>
          </div>
          {isPro ? (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Download className="h-4 w-4" />
              {exporting ? '...' : (ar ? 'تصدير CSV' : 'Export CSV')}
            </button>
          ) : (
            <div className="relative group">
              <button
                disabled
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-slate-200 text-slate-400 cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {ar ? 'تصدير CSV' : 'Export CSV'}
              </button>
              <div className="absolute end-0 top-full mt-1 hidden group-hover:block bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10">
                {ar ? 'الترقية لـ PRO لتصدير البيانات' : 'Upgrade to PRO to export data'}
              </div>
            </div>
          )}
        </div>

        {isAdmin ? (
          <div className="card text-center py-16">
            <ShieldCheck className="h-12 w-12 text-brand-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              {ar ? 'لوحة الإدارة' : 'Admin Dashboard'}
            </h2>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              {ar
                ? 'بوصفك مدير المنصة، تجد إحصائيات النظام الكاملة في لوحة الإدارة.'
                : 'As platform admin, full system analytics are available on the Admin Dashboard.'}
            </p>
            <Link
              href={`/${locale}/dashboard/admin`}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              {ar ? 'اذهب إلى لوحة الإدارة' : 'Go to Admin Dashboard'}
            </Link>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <Skeleton className="h-48" />
          </div>
        ) : !data ? (
          <div className="card text-center py-12">
            <BarChart2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">{ar ? 'لا توجد بيانات كافية بعد' : 'Not enough data yet'}</p>
          </div>
        ) : isSupplier ? (
          <SupplierAnalytics data={data} ar={ar} locale={locale} />
        ) : isBuyer ? (
          <BuyerAnalytics data={data} ar={ar} />
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function SupplierAnalytics({ data, ar, locale }: { data: any; ar: boolean; locale: string }) {
  const { overview, topProducts, monthlyQuotes } = data;

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label={ar ? 'إجمالي العروض' : 'Total Quotes'}
          value={overview.totalQuotes}
          sub={ar ? `${overview.pendingQuotes} معلق` : `${overview.pendingQuotes} pending`}
          color="brand"
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label={ar ? 'معدل الفوز' : 'Win Rate'}
          value={`${overview.winRate}%`}
          sub={ar ? `${overview.acceptedQuotes} مقبول` : `${overview.acceptedQuotes} accepted`}
          color="green"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label={ar ? 'إجمالي الإيراد' : 'Total Revenue'}
          value={`${overview.totalRevenue.toLocaleString()} SAR`}
          sub={ar ? `${overview.completedDeals} صفقة مكتملة` : `${overview.completedDeals} completed deals`}
          color="amber"
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label={ar ? 'متوسط التقييم' : 'Avg. Rating'}
          value={overview.avgRating ? `${overview.avgRating}/5` : '—'}
          sub={ar ? `${overview.totalRatings} تقييم` : `${overview.totalRatings} ratings`}
          color="purple"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label={ar ? 'منتجات نشطة' : 'Active Listings'}
          value={overview.activeListings}
          sub={ar ? `${overview.totalListings} إجمالي` : `${overview.totalListings} total`}
          color="brand"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label={ar ? 'الصفقات المكتملة' : 'Completed Deals'}
          value={overview.completedDeals}
          sub={ar ? `${overview.totalDeals} إجمالي` : `${overview.totalDeals} total`}
          color="green"
        />
        <StatCard
          icon={<XCircle className="h-5 w-5" />}
          label={ar ? 'العروض المرفوضة' : 'Rejected Quotes'}
          value={overview.rejectedQuotes}
          color="red"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={ar ? 'نسبة الإغلاق' : 'Close Rate'}
          value={`${overview.winRate}%`}
          sub={ar ? 'من إجمالي العروض' : 'of all quotes'}
          color="purple"
        />
      </div>

      {/* Win rate donut visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quote status breakdown */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">{ar ? 'حالة العروض' : 'Quote Status Breakdown'}</h3>
          <div className="space-y-3">
            {[
              { label: ar ? 'مقبولة' : 'Accepted', count: overview.acceptedQuotes, color: 'bg-green-500', pct: overview.totalQuotes > 0 ? Math.round((overview.acceptedQuotes / overview.totalQuotes) * 100) : 0 },
              { label: ar ? 'معلقة' : 'Pending', count: overview.pendingQuotes, color: 'bg-amber-500', pct: overview.totalQuotes > 0 ? Math.round((overview.pendingQuotes / overview.totalQuotes) * 100) : 0 },
              { label: ar ? 'مرفوضة' : 'Rejected', count: overview.rejectedQuotes, color: 'bg-red-400', pct: overview.totalQuotes > 0 ? Math.round((overview.rejectedQuotes / overview.totalQuotes) * 100) : 0 },
              { label: ar ? 'منسحبة' : 'Withdrawn', count: overview.totalQuotes - overview.acceptedQuotes - overview.pendingQuotes - overview.rejectedQuotes, color: 'bg-slate-300', pct: 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1 text-xs text-slate-600">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.count} ({item.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly quotes chart */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">{ar ? 'العروض الشهرية (6 أشهر)' : 'Monthly Quotes (6 months)'}</h3>
          <BarChart data={monthlyQuotes.map((m: any) => ({ label: m.label, count: m.count }))} color="brand" />
        </div>
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">{ar ? 'أفضل المنتجات (بالمشاهدات)' : 'Top Products by Views'}</h3>
          <div className="space-y-3">
            {topProducts.map((product: any, i: number) => (
              <div key={product.id} className="flex items-center gap-3 rounded-xl hover:bg-slate-50 px-2 py-1.5 transition-all">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {ar ? product.titleAr : product.titleEn}
                  </p>
                  <p className="text-xs text-slate-400">{product._count.quotes} {ar ? 'عرض' : 'quotes'}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Eye className="h-3.5 w-3.5" />
                  {product.viewCount}
                </div>
                <Link
                  href={`/${locale}/products/${product.slug || product.id}`}
                  className="text-xs text-brand-600 hover:underline"
                >
                  {ar ? 'عرض' : 'View'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BuyerAnalytics({ data, ar }: { data: any; ar: boolean }) {
  const { overview, categoryStats = [], monthlyRfqs } = data;

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label={ar ? 'إجمالي الطلبات' : 'Total RFQs'}
          value={overview.totalRfqs}
          sub={ar ? `${overview.openRfqs} مفتوح` : `${overview.openRfqs} open`}
          color="brand"
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label={ar ? 'معدل الترسية' : 'Award Rate'}
          value={`${overview.awardRate}%`}
          sub={ar ? `${overview.awardedRfqs} مُرسى` : `${overview.awardedRfqs} awarded`}
          color="green"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label={ar ? 'إجمالي الإنفاق' : 'Total Spending'}
          value={`${overview.totalSpending.toLocaleString()} SAR`}
          sub={ar ? `${overview.completedDeals} صفقة مكتملة` : `${overview.completedDeals} completed`}
          color="amber"
        />
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label={ar ? 'متوسط العروض لكل طلب' : 'Avg Quotes/RFQ'}
          value={overview.avgQuotesPerRfq}
          sub={ar ? `${overview.totalQuotesReceived} إجمالي العروض` : `${overview.totalQuotesReceived} total quotes`}
          color="purple"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFQ status breakdown */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">{ar ? 'حالة الطلبات' : 'RFQ Status Breakdown'}</h3>
          <div className="space-y-3">
            {[
              { label: ar ? 'مفتوحة' : 'Open', count: overview.openRfqs, color: 'bg-brand-500' },
              { label: ar ? 'مُرساة' : 'Awarded', count: overview.awardedRfqs, color: 'bg-green-500' },
              { label: ar ? 'مغلقة' : 'Closed', count: overview.closedRfqs, color: 'bg-slate-400' },
              { label: ar ? 'ملغاة' : 'Cancelled', count: overview.cancelledRfqs, color: 'bg-red-400' },
            ].map((item) => {
              const pct = overview.totalRfqs > 0 ? Math.round((item.count / overview.totalRfqs) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1 text-xs text-slate-600">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly RFQs chart */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">{ar ? 'الطلبات الشهرية (6 أشهر)' : 'Monthly RFQs (6 months)'}</h3>
          <BarChart data={monthlyRfqs.map((m: any) => ({ label: m.label, count: m.count }))} color="green" />
        </div>
      </div>

      {/* Category breakdown */}
      {categoryStats.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">{ar ? 'توزيع الطلبات حسب الفئة' : 'RFQs by Category'}</h3>
          <div className="space-y-3">
            {categoryStats.map((item: any) => {
              const pct = overview.totalRfqs > 0 ? Math.round((item.count / overview.totalRfqs) * 100) : 0;
              return (
                <div key={item.category.id}>
                  <div className="flex items-center justify-between mb-1 text-xs text-slate-600">
                    <span>{ar ? item.category.nameAr : item.category.nameEn}</span>
                    <span className="font-semibold">{item.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
