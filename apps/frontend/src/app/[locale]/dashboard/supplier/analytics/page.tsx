'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import {
  BarChart3, Star, ShieldCheck, Package, Briefcase, TrendingUp,
  Award, CheckCircle2, RefreshCw, Truck,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrustBadge } from '@/components/ui/TrustBadge';
import api from '@/lib/api';

interface SupplierAnalyticsOverview {
  totalQuotes: number;
  pendingQuotes: number;
  acceptedQuotes: number;
  rejectedQuotes: number;
  winRate: number;
  totalDeals: number;
  completedDeals: number;
  cancelledDeals: number;
  activeListings: number;
  totalListings: number;
  totalRevenue: number;
  avgRating: number | null;
  totalRatings: number;
  deliverySuccessRate: number | null;
  trustTier: string;
  supplierScore: number | null;
}

interface MonthlyBucket {
  label: string;
  month: string;
  count: number;
}

interface AnalyticsData {
  overview: SupplierAnalyticsOverview;
  monthlyQuotes: MonthlyBucket[];
}

function StatCard({
  icon, label, value, sub, color = 'brand',
}: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    brand:  'bg-brand-50 text-brand-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
    blue:   'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    teal:   'bg-teal-50 text-teal-600',
  };
  return (
    <div className="card">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${colorMap[color] || colorMap.brand}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-sm font-medium text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  );
}

const MAX_BAR = 8; // max count for bar chart scaling

export default function SupplierAnalyticsPage() {
  const locale = useLocale();
  const ar = locale === 'ar';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/supplier');
      setData(res.data.data ?? res.data);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const ov = data?.overview;
  const maxCount = data ? Math.max(...data.monthlyQuotes.map((m) => m.count), 1) : 1;

  return (
    <DashboardLayout>
      <div className="space-y-7 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{ar ? 'تحليلات المورد' : 'Supplier Analytics'}</h1>
              <p className="text-xs text-slate-500">{ar ? 'أداؤك وسمعتك على منصة موازن' : 'Your performance and reputation on Mwazn'}</p>
            </div>
          </div>
          <button onClick={load} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          </div>
        ) : !data ? (
          <div className="card py-16 text-center text-slate-500">
            {ar ? 'تعذّر تحميل البيانات' : 'Could not load analytics'}
          </div>
        ) : (
          <>
            {/* ── Trust & Reputation ────────────────────────────────────── */}
            <div>
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                {ar ? 'الثقة والسمعة' : 'Trust & Reputation'}
              </h2>
              <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  {/* Trust tier */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{ar ? 'مستوى الثقة' : 'Trust Tier'}</p>
                      <TrustBadge tier={ov?.trustTier} ar={ar} />
                      {ov?.trustTier === 'STANDARD' && (
                        <span className="text-xs text-slate-400">{ar ? 'قياسي' : 'Standard'}</span>
                      )}
                    </div>
                  </div>

                  <div className="h-px sm:h-16 sm:w-px bg-slate-100" />

                  {/* Platform score */}
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1.5">{ar ? 'نقاط المنصة (0-100)' : 'Platform Score (0–100)'}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all"
                          style={{ width: `${ov?.supplierScore ?? 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-800 tabular-nums w-8 text-right">
                        {ov?.supplierScore ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="h-px sm:h-16 sm:w-px bg-slate-100" />

                  {/* Avg rating */}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{ar ? 'تقييم العملاء' : 'Customer Rating'}</p>
                    {ov?.avgRating ? (
                      <div className="flex items-center gap-2">
                        <StarRating rating={ov.avgRating} />
                        <span className="text-sm font-bold text-slate-800">{ov.avgRating.toFixed(1)}</span>
                        <span className="text-xs text-slate-400">({ov.totalRatings})</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">{ar ? 'لا توجد تقييمات بعد' : 'No ratings yet'}</p>
                    )}
                  </div>

                  <div className="h-px sm:h-16 sm:w-px bg-slate-100" />

                  {/* Delivery success */}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{ar ? 'معدل التسليم الناجح' : 'Delivery Success'}</p>
                    {ov?.deliverySuccessRate !== null && ov?.deliverySuccessRate !== undefined ? (
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-bold text-slate-800">{ov.deliverySuccessRate}%</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">{ar ? 'لا توجد صفقات بعد' : 'No deals yet'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Quotes Overview ───────────────────────────────────────── */}
            <div>
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                {ar ? 'نظرة عامة على العروض' : 'Quotes Overview'}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label={ar ? 'إجمالي العروض' : 'Total Quotes'}
                  value={ov?.totalQuotes ?? 0}
                  sub={ar ? `${ov?.pendingQuotes ?? 0} بانتظار` : `${ov?.pendingQuotes ?? 0} pending`}
                  color="brand"
                />
                <StatCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label={ar ? 'عروض مقبولة' : 'Accepted'}
                  value={ov?.acceptedQuotes ?? 0}
                  color="green"
                />
                <StatCard
                  icon={<BarChart3 className="h-5 w-5" />}
                  label={ar ? 'معدل الفوز' : 'Win Rate'}
                  value={`${ov?.winRate ?? 0}%`}
                  sub={ar ? 'نسبة العروض المقبولة' : 'Accepted / total quotes'}
                  color="teal"
                />
                <StatCard
                  icon={<Package className="h-5 w-5" />}
                  label={ar ? 'المنتجات النشطة' : 'Active Listings'}
                  value={ov?.activeListings ?? 0}
                  sub={ar ? `${ov?.totalListings ?? 0} إجمالي` : `${ov?.totalListings ?? 0} total`}
                  color="purple"
                />
              </div>
            </div>

            {/* ── Deals Summary ─────────────────────────────────────────── */}
            <div>
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                {ar ? 'ملخص الصفقات' : 'Deals Summary'}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<Briefcase className="h-5 w-5" />}
                  label={ar ? 'إجمالي الصفقات' : 'Total Deals'}
                  value={ov?.totalDeals ?? 0}
                  color="brand"
                />
                <StatCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label={ar ? 'صفقات مكتملة' : 'Completed'}
                  value={ov?.completedDeals ?? 0}
                  color="green"
                />
                <StatCard
                  icon={<Truck className="h-5 w-5" />}
                  label={ar ? 'معدل التسليم' : 'Delivery Rate'}
                  value={ov?.deliverySuccessRate !== null && ov?.deliverySuccessRate !== undefined ? `${ov.deliverySuccessRate}%` : '—'}
                  sub={ar ? 'مكتملة / (مكتملة + ملغاة)' : 'Completed / (completed + cancelled)'}
                  color="teal"
                />
                <StatCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label={ar ? 'إجمالي الإيرادات' : 'Total Revenue'}
                  value={`${(ov?.totalRevenue ?? 0).toLocaleString()} SAR`}
                  sub={ar ? 'من الصفقات المكتملة' : 'From completed deals'}
                  color="amber"
                />
              </div>
            </div>

            {/* ── Monthly Quotes Trend ──────────────────────────────────── */}
            {data.monthlyQuotes.length > 0 && (
              <div>
                <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  {ar ? 'اتجاه العروض الشهري (6 أشهر)' : 'Monthly Quotes Trend (6 months)'}
                </h2>
                <div className="card">
                  <div className="flex items-end gap-3 h-32">
                    {data.monthlyQuotes.map((m) => (
                      <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-xs font-bold text-slate-600 tabular-nums">{m.count}</span>
                        <div className="w-full rounded-t-lg bg-brand-100 flex items-end overflow-hidden" style={{ height: '80px' }}>
                          <div
                            className="w-full bg-gradient-to-t from-brand-700 to-brand-500 rounded-t-lg transition-all"
                            style={{ height: `${Math.max((m.count / maxCount) * 100, m.count > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
