'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  Star, Search, ArrowLeft, Building2, ShieldCheck, MapPin, BarChart3,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupplierRating {
  id: string;
  nameAr: string;
  nameEn: string;
  city?: string;
  slug?: string;
  logoUrl?: string;
  verificationStatus: string;
  supplierScore?: number;   // 0-100 composite platform score
  avgRating?: number;       // 1-5 customer rating average
  _count?: { listings: number; quotesReceived: number };
}

// ─── Star display (avgRating 1-5 only) ───────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3 w-3 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </div>
  );
}

// ─── Platform score bar (supplierScore 0-100) ─────────────────────────────────

function PlatformScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-slate-600">{Math.round(score)}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRatingsPage() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;

  const [suppliers, setSuppliers] = useState<SupplierRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'rating_desc' | 'name'>('rating_desc');

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/companies', {
        params: { limit: 200, type: 'SUPPLIER' },
      });
      const list: SupplierRating[] =
        res.data?.items ?? res.data?.data?.items ?? [];
      setSuppliers(list);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  // Filter + sort
  let filtered = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (ar ? s.nameAr : s.nameEn).toLowerCase();
    return name.includes(q) || (s.city ?? '').toLowerCase().includes(q);
  });

  if (sortBy === 'score_desc') {
    filtered = [...filtered].sort((a, b) => (b.supplierScore ?? 0) - (a.supplierScore ?? 0));
  } else if (sortBy === 'score_asc') {
    filtered = [...filtered].sort((a, b) => (a.supplierScore ?? 0) - (b.supplierScore ?? 0));
  } else if (sortBy === 'rating_desc') {
    filtered = [...filtered].sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  } else {
    filtered = [...filtered].sort((a, b) =>
      (ar ? a.nameAr : a.nameEn).localeCompare(ar ? b.nameAr : b.nameEn)
    );
  }

  const withRating = suppliers.filter((s) => (s.avgRating ?? 0) > 0).length;
  const avgScore = withRating > 0
    ? (suppliers.reduce((sum, s) => sum + (s.avgRating ?? 0), 0) / withRating).toFixed(1)
    : '—';

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
                {ar ? 'تقييمات الموردين' : 'Supplier Ratings'}
              </h1>
            </div>
            <p className="text-sm text-slate-500 ps-6">
              {ar
                ? `${suppliers.length} مورّد · ${withRating} لديهم تقييم عملاء · متوسط ${avgScore} ★`
                : `${suppliers.length} suppliers · ${withRating} customer-rated · avg ${avgScore} ★`}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />
            <p className="text-xs text-slate-600">
              {ar
                ? 'متوسط التقييم (1–5): تقييمات المشترين عبر الصفقات المكتملة'
                : 'Customer Rating (1–5): buyer ratings across completed deals'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-500 shrink-0" />
            <p className="text-xs text-slate-600">
              {ar
                ? 'نقاط المنصة (0–100): درجة مركّبة تشمل التحقق والخطة والتقييم ومعدل الإنجاز والقوائم'
                : 'Platform Score (0–100): composite — verification + plan + rating + completion + listings'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? 'بحث بالاسم أو المدينة...' : 'Search by name or city…'}
              className="input-base ps-9 w-full"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="input-base w-52"
          >
            <option value="rating_desc">{ar ? 'أعلى تقييم عملاء' : 'Highest Customer Rating'}</option>
            <option value="score_desc">{ar ? 'أعلى نقاط منصة' : 'Highest Platform Score'}</option>
            <option value="score_asc">{ar ? 'أدنى نقاط منصة' : 'Lowest Platform Score'}</option>
            <option value="name">{ar ? 'الاسم' : 'Name (A–Z)'}</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : error ? (
          <div className="card flex flex-col items-center py-14 text-center">
            <Star className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'تعذّر تحميل البيانات' : 'Failed to load suppliers'}</p>
            <button onClick={fetchSuppliers} className="mt-3 text-xs text-brand-600 hover:underline">
              {ar ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-14 text-center">
            <Star className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'لا توجد نتائج' : 'No results found'}</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-[1fr_130px_120px_130px_36px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              {[
                ar ? 'المورّد' : 'Supplier',
                ar ? 'المدينة' : 'City',
                ar ? 'تقييم العملاء ★' : 'Customer Rating ★',
                ar ? 'نقاط المنصة' : 'Platform Score',
                '',
              ].map((h, i) => (
                <p key={i} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</p>
              ))}
            </div>

            <div className="divide-y divide-slate-50">
              {filtered.map((supplier) => (
                <Link
                  key={supplier.id}
                  href={`${base}/admin/companies/${supplier.id}`}
                  className="flex md:grid md:grid-cols-[1fr_130px_120px_130px_36px] gap-4 items-center px-4 py-3.5 hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Name + avatar */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-xs font-bold">
                      {(ar ? supplier.nameAr : supplier.nameEn).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-700 transition-colors">
                        {ar ? supplier.nameAr : supplier.nameEn}
                      </p>
                      {supplier.verificationStatus === 'VERIFIED' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <ShieldCheck className="h-3 w-3" />
                          {ar ? 'موثّق' : 'Verified'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* City */}
                  <p className="hidden md:flex items-center gap-1 text-xs text-slate-500 truncate">
                    {supplier.city ? (
                      <><MapPin className="h-3 w-3 shrink-0 text-slate-400" />{supplier.city}</>
                    ) : '—'}
                  </p>

                  {/* Customer Rating (avgRating 1-5) */}
                  <div className="hidden md:block">
                    {(supplier.avgRating ?? 0) > 0 ? (
                      <div className="space-y-0.5">
                        <StarRow rating={supplier.avgRating!} />
                        <span className="text-[10px] text-slate-500">{supplier.avgRating!.toFixed(1)} / 5</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">{ar ? 'لا يوجد' : 'No ratings'}</span>
                    )}
                  </div>

                  {/* Platform Score (supplierScore 0-100) */}
                  <div className="hidden md:block">
                    {(supplier.supplierScore ?? 0) > 0 ? (
                      <PlatformScoreBar score={supplier.supplierScore!} />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>

                  <Building2 className="h-4 w-4 text-slate-300 group-hover:text-brand-400 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
