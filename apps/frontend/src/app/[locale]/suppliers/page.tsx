import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { MapPin, Star, Package, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verified Suppliers | موردون موثقون — Mwazn',
  description: 'Browse verified Saudi B2B suppliers on Mwazn. Find trusted suppliers across all categories — industrial, construction, food, technology and more.',
  openGraph: {
    title: 'Verified Saudi B2B Suppliers — Mwazn | موازن',
    description: 'Browse verified Saudi suppliers across all industries.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Verified Suppliers — Mwazn | موازن',
    description: 'Browse verified Saudi B2B suppliers.',
  },
};

// Server-side: prefer internal Docker network URL, fall back to public
const API = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

interface SupplierItem {
  id: string;
  nameEn: string;
  nameAr: string;
  city: string | null;
  plan: string;
  slug: string | null;
  logoUrl: string | null;
  verificationStatus: string;
  averageRating: number;
  totalRatings: number;
  _count: { listings: number; dealsAsSupplier: number };
}

interface SearchResult {
  items: SupplierItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

async function fetchSuppliers(): Promise<SearchResult | null> {
  try {
    const res = await fetch(`${API}/suppliers/search?limit=20&verified=true`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as SearchResult;
  } catch {
    return null;
  }
}

const SAUDI_CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Jubail', 'Madinah'];

export default async function SuppliersPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';

  const result = await fetchSuppliers();
  const suppliers: SupplierItem[] = result?.items ?? [];
  const total = result?.total ?? 0;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-16 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {ar ? 'موردون موثقون في موازن' : 'Verified Suppliers on Mwazn'}
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            {ar
              ? `اكتشف ${total > 0 ? `${total}+` : 'أكثر من 200'} مورداً موثقاً بالسجل التجاري في مختلف القطاعات`
              : `Discover ${total > 0 ? `${total}+` : '200+'} CR-verified suppliers across all major industries`}
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Filter bar (visual — search/filter is server-side in full implementation) */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Shield className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
              <div className="input-base ps-9 bg-white text-slate-400 cursor-default select-none">
                {ar ? 'عرض الموردين الموثقين بالسجل التجاري' : 'Showing CR-verified suppliers'}
              </div>
            </div>
            <select className="input-base sm:w-44 bg-white" disabled>
              <option>{ar ? 'جميع المدن' : 'All Cities'}</option>
              {SAUDI_CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Supplier grid */}
          {suppliers.length === 0 ? (
            <div className="py-24 text-center text-slate-500">
              {ar ? 'لا توجد موردون متاحون حالياً.' : 'No suppliers available at the moment.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {suppliers.map((sup) => (
                <Link
                  key={sup.id}
                  href={`/${locale}/suppliers/${sup.slug ?? sup.id}`}
                  className="card card-hover group flex flex-col gap-4"
                >
                  {/* Logo */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 font-bold text-2xl mx-auto overflow-hidden">
                    {sup.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sup.logoUrl} alt="" className="h-16 w-16 object-cover" />
                    ) : (
                      (ar ? sup.nameAr : sup.nameEn).charAt(0)
                    )}
                  </div>

                  {/* Name + badges */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 group-hover:text-brand-700 transition-colors leading-tight">
                        {ar ? sup.nameAr : sup.nameEn}
                      </p>
                      {sup.plan === 'PRO' && (
                        <span className="inline-flex items-center rounded-full bg-gold-400/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-600">PRO</span>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {sup.city ?? '—'}
                      </p>
                      {sup.verificationStatus === 'VERIFIED' && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <Shield className="h-2.5 w-2.5" />
                          {ar ? 'موثق' : 'CR Verified'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-gold-500 fill-gold-500" />
                      {sup.averageRating > 0 ? sup.averageRating.toFixed(1) : '—'}
                      {sup.totalRatings > 0 && <span className="text-slate-400">({sup.totalRatings})</span>}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {ar ? `${sup._count.listings} منتج` : `${sup._count.listings} products`}
                    </span>
                  </div>

                  <div className="mt-auto pt-2 border-t border-slate-100 text-center">
                    <span className="text-xs font-medium text-brand-700 group-hover:underline">
                      {ar ? 'عرض الصفحة' : 'View Showroom'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href={`/${locale}/auth/register?type=BUYER`}
              className="btn-primary inline-flex items-center gap-2"
            >
              {ar ? 'سجّل للوصول لكل الموردين' : 'Register to Access All Suppliers'}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 bg-white mt-10">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-700">
              <span className="text-xs font-bold text-white">م</span>
            </div>
            <span className="font-semibold text-brand-700">{ar ? 'موازن' : 'Mwazn'}</span>
          </div>
          <p className="text-sm text-slate-400">
            © 2026 Mwazn. {ar ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
