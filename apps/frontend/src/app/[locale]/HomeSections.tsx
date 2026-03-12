'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StarRating } from '@/components/ui/StarRating';
import { resolveListingImage } from '@/lib/categoryImages';
import {
  ArrowRight, CheckCircle2, FileText, BarChart3,
  Shield, TrendingUp, TrendingDown, Building2, Package,
  Award, ShoppingBag, HandshakeIcon, ArrowUpRight,
  Minus, Activity, Layers, Clock, Tag, MapPin, Star, Users,
  Loader2, LayoutDashboard, PlusCircle,
} from 'lucide-react';

// ─── Types (exported so server page.tsx can import them) ─────────────────────

export interface HomeStat {
  totalRFQs: number; totalVendors: number; totalProducts: number; totalTransactions: number;
}
export interface HomeSupplier {
  id: string; nameEn: string; nameAr: string; city: string | null;
  plan: string; slug: string | null; logoUrl: string | null;
  averageRating: number; totalRatings: number;
  _count: { listings: number };
}
export interface HomeProduct {
  id: string; slug: string | null; titleEn: string; titleAr: string; price: string | null;
  currency: string; unit: string | null;
  supplier: { id: string; nameEn: string; nameAr: string; slug: string | null; city?: string | null; verificationStatus?: string; isFreelancer?: boolean };
  category: { nameEn: string; nameAr: string; slug?: string };
  images: Array<{ url: string }>;
  _count: { quotes: number };
}
export interface HomeShowroom extends HomeSupplier {
  listings: Array<{ id: string; titleEn: string; titleAr: string; images: Array<{ url: string }> }>;
}
export interface HomeRFQ {
  id: string; title: string; quantity: number; unit: string;
  budget: string | null; budgetUndisclosed: boolean; currency: string;
  deadline: string; createdAt: string;
  category: { nameEn: string; nameAr: string; slug: string };
  buyer: { nameEn: string; nameAr: string; city: string | null };
  _count: { quotes: number };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  stats: HomeStat;
  suppliers: HomeSupplier[];
  products: HomeProduct[];
  showrooms: HomeShowroom[];
  rfqs: HomeRFQ[];
}

// ─── Trust badge helper ───────────────────────────────────────────────────────

function getSellerBadge(company: { verificationStatus?: string; isFreelancer?: boolean }, ar: boolean) {
  if (company.isFreelancer) return { label: ar ? 'بائع مستقل' : 'Independent Seller', color: 'blue' as const };
  if (company.verificationStatus === 'VERIFIED') return { label: ar ? 'سجل تجاري موثّق' : 'CR Verified', color: 'green' as const };
  return null;
}

// ─── Mock comparison preview ──────────────────────────────────────────────────

const MOCK_QUOTES = [
  { nameAr: 'شركة الرياض التقنية', nameEn: 'Riyadh Tech Co.', price: '230', delivery: 3, rating: 4.8, tag: 'below' as const },
  { nameAr: 'مؤسسة الخليج الرقمي', nameEn: 'Gulf Digital Est.', price: '295', delivery: 5, rating: 4.2, tag: 'above' as const },
  { nameAr: 'تقنية النجم السعودي', nameEn: 'Star Saudi Tech', price: '258', delivery: 4, rating: 4.5, tag: 'market' as const },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function PriceTag({ tag, ar }: { tag: 'below' | 'above' | 'market'; ar: boolean }) {
  if (tag === 'below') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <TrendingDown className="h-3 w-3" />
      {ar ? 'أقل من السوق' : 'Below Market'}
    </span>
  );
  if (tag === 'above') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      <TrendingUp className="h-3 w-3" />
      {ar ? 'أعلى من السوق' : 'Above Market'}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
      <Minus className="h-3 w-3" />
      {ar ? 'السعر السوقي' : 'Market Rate'}
    </span>
  );
}

// ─── Shared marketplace section components ────────────────────────────────────

function ProductsSection({ products, ar, locale }: { products: HomeProduct[]; ar: boolean; locale: string }) {
  return (
    <section className="py-20 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span
              className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: 'rgba(201,163,73,0.12)', color: '#8B6420' }}
            >
              {ar ? 'المنتجات الأكثر طلباً' : 'Most Requested Products'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
              {ar ? 'منتجات مميزة من موردين موثقين' : 'Featured Products from Verified Suppliers'}
            </h2>
          </div>
          <Link
            href={`/${locale}/products`}
            className="hidden items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 sm:inline-flex"
          >
            {ar ? 'عرض الكل' : 'View All'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/${locale}/products/${product.slug ?? product.id}`}
              className="card card-hover group overflow-hidden p-0"
            >
              <div className="relative h-44 overflow-hidden bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveListingImage(product.images[0]?.url, product.category.slug, 0, product.id)}
                  alt={product.titleEn}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute start-2 top-2">
                  <span className="rounded-lg bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-600 backdrop-blur">
                    {ar ? product.category.nameAr : product.category.nameEn}
                  </span>
                </div>
                {product._count.quotes > 0 && (
                  <div className="absolute end-2 top-2">
                    <span className="rounded-lg bg-brand-700/90 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
                      {product._count.quotes} {ar ? 'عرض' : 'quotes'}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="mb-1.5 line-clamp-2 text-sm font-semibold text-slate-800 leading-snug">
                  {ar ? product.titleAr : product.titleEn}
                </p>
                <div className="mb-3 flex items-center gap-1.5">
                  <Shield className="h-3 w-3 shrink-0 text-emerald-600" />
                  <span className="truncate text-xs font-medium text-slate-600">
                    {ar ? product.supplier.nameAr : product.supplier.nameEn}
                  </span>
                  {product.supplier.city && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400 truncate">{product.supplier.city}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  {product.price ? (
                    <span className="text-sm font-bold text-brand-700">
                      {Number(product.price).toLocaleString()} <span className="font-normal text-xs text-slate-400">{product.currency}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">{ar ? 'استفسر للسعر' : 'Request quote'}</span>
                  )}
                  {(() => {
                    const badge = getSellerBadge(product.supplier, ar);
                    if (!badge) return null;
                    const cls = badge.color === 'blue'
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-emerald-700 bg-emerald-50';
                    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{badge.label}</span>;
                  })()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SuppliersSection({ suppliers, ar, locale }: { suppliers: (HomeSupplier & { isFreelancer?: boolean })[]; ar: boolean; locale: string }) {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="mb-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {ar ? 'أعلى الموردين تقييماً' : 'Top Rated Suppliers'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
              {ar ? 'موردون موثقون وذوو سمعة عالية' : 'Verified & Highly-Rated Suppliers'}
            </h2>
          </div>
          <Link
            href={`/${locale}/suppliers`}
            className="hidden items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 sm:inline-flex"
          >
            {ar ? 'عرض الكل' : 'View All'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {suppliers.map((supplier) => (
            <Link
              key={supplier.id}
              href={`/${locale}/suppliers/${supplier.slug ?? supplier.id}`}
              className="card card-hover group flex flex-col overflow-hidden p-0"
            >
              <div className="relative h-16 flex-shrink-0 bg-gradient-to-br from-brand-900 to-brand-700">
                {supplier.plan === 'PRO' && (
                  <span
                    className="absolute end-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ background: 'rgba(201,163,73,0.85)' }}
                  >
                    PRO
                  </span>
                )}
              </div>
              <div className="-mt-6 mb-3 flex items-end justify-between px-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white text-lg font-bold text-brand-700 shadow-card">
                  {supplier.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={supplier.logoUrl} alt="" className="h-14 w-14 object-cover" />
                  ) : (
                    (ar ? supplier.nameAr : supplier.nameEn).charAt(0)
                  )}
                </div>
                {(() => {
                  const badge = getSellerBadge(supplier, ar);
                  if (!badge) return null;
                  const cls = badge.color === 'blue'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700';
                  return (
                    <span className={`mb-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
                      <Shield className="h-3 w-3" />
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
              <div className="flex flex-1 flex-col px-4 pb-4">
                <h3 className="mb-0.5 line-clamp-1 text-sm font-semibold text-slate-800 transition-colors group-hover:text-brand-700">
                  {ar ? supplier.nameAr : supplier.nameEn}
                </h3>
                {supplier.city && (
                  <p className="mb-2 flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {supplier.city}
                  </p>
                )}
                <div className="mt-auto space-y-2">
                  {supplier.averageRating > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <StarRating score={supplier.averageRating} />
                      <span className="text-xs font-semibold text-slate-700">
                        {supplier.averageRating.toFixed(1)}
                      </span>
                      {supplier.totalRatings > 0 && (
                        <span className="text-xs text-slate-400">
                          ({supplier.totalRatings} {ar ? 'تقييم' : 'reviews'})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Star className="h-3 w-3" />
                      {ar ? 'لا تقييمات بعد' : 'No ratings yet'}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Package className="h-3 w-3" />
                      {supplier._count.listings} {ar ? 'منتج' : 'products'}
                    </span>
                    <span className="text-[10px] font-semibold text-brand-600 group-hover:text-brand-700 transition-colors">
                      {ar ? 'عرض الملف ←' : 'View Profile →'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowroomsSection({ showrooms, ar, locale }: { showrooms: (HomeShowroom & { isFreelancer?: boolean })[]; ar: boolean; locale: string }) {
  return (
    <section className="py-20 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="mb-2 inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              {ar ? 'معارض المورّدين المميزين' : 'Premium Showrooms'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
              {ar ? 'استكشف متاجر الموردين الكاملة' : 'Explore Full Supplier Showrooms'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {ar ? 'كتالوجات حية، تقييمات حقيقية، وملفات موثّقة.' : 'Live catalogues, real ratings, and verified profiles.'}
            </p>
          </div>
          <Link
            href={`/${locale}/suppliers`}
            className="hidden items-center gap-1.5 text-sm font-semibold text-brand-700 sm:inline-flex"
          >
            {ar ? 'عرض الكل' : 'View All'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {showrooms.map((showroom) => (
            <Link
              key={showroom.id}
              href={`/${locale}/suppliers/${showroom.slug ?? showroom.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="relative grid grid-cols-4 h-28 bg-slate-50 overflow-hidden">
                {showroom.listings.slice(0, 4).map((listing, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={listing.id}
                    src={resolveListingImage(listing.images[0]?.url, undefined, i, listing.id)}
                    alt={listing.titleEn}
                    className={`h-28 w-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-90 ${i === 0 ? '' : 'border-s border-white/60'}`}
                  />
                ))}
                {showroom.listings.length === 0 && (
                  <div className="col-span-4 flex h-28 items-center justify-center bg-slate-50">
                    <Building2 className="h-10 w-10 text-slate-200" />
                  </div>
                )}
                {showroom.plan === 'PRO' && (
                  <div className="absolute end-2 top-2">
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: 'rgba(201,163,73,0.90)' }}>
                      PRO
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 transition-colors group-hover:text-brand-700 truncate">
                      {ar ? showroom.nameAr : showroom.nameEn}
                    </h3>
                    {showroom.city && (
                      <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {showroom.city}
                      </p>
                    )}
                  </div>
                  {(() => {
                    const badge = getSellerBadge(showroom, ar);
                    if (!badge) return null;
                    const cls = badge.color === 'blue'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700';
                    return (
                      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
                        <Shield className="h-2.5 w-2.5" />
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {showroom.averageRating > 0 ? (
                      <>
                        <StarRating score={showroom.averageRating} />
                        <span className="font-semibold text-slate-700">{showroom.averageRating.toFixed(1)}</span>
                        {showroom.totalRatings > 0 && (
                          <span className="text-slate-400">({showroom.totalRatings})</span>
                        )}
                      </>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Package className="h-3 w-3" />
                        {showroom._count.listings} {ar ? 'منتج' : 'products'}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 font-bold text-brand-700 group-hover:text-brand-800 transition-colors">
                    {ar ? 'زيارة المعرض' : 'View Showroom'}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function RFQsSection({ rfqs, ar, locale, isBuyer }: { rfqs: HomeRFQ[]; ar: boolean; locale: string; isBuyer: boolean }) {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {ar ? 'أحدث الفرص' : 'Latest Opportunities'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
              {ar ? 'طلبات عروض الأسعار المفتوحة' : 'Open Requests for Quotation'}
            </h2>
          </div>
          {!isBuyer && (
            <Link
              href={`/${locale}/dashboard/rfqs`}
              className="hidden items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 sm:inline-flex"
            >
              {ar ? 'تصفح الكل' : 'Browse All'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rfqs.map((rfq) => {
            const daysLeft = Math.max(0, Math.ceil((new Date(rfq.deadline).getTime() - Date.now()) / 86400_000));
            const urgency = daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low';
            return (
              <div key={rfq.id} className="card flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    urgency === 'high' ? 'bg-red-50 text-red-700' :
                    urgency === 'medium' ? 'bg-amber-50 text-amber-700' :
                    'bg-emerald-50 text-emerald-700'
                  }`}>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {daysLeft === 0 ? (ar ? 'ينتهي اليوم' : 'Ends today') :
                       ar ? `${daysLeft} يوم متبقٍ` : `${daysLeft}d left`}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                    <Users className="h-3 w-3" />
                    {rfq._count.quotes} {ar ? 'عروض' : 'quotes'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1 leading-snug">
                    {rfq.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {ar ? rfq.buyer.nameAr : rfq.buyer.nameEn}
                    {rfq.buyer.city ? ` · ${rfq.buyer.city}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                    <Tag className="h-3 w-3" />
                    {ar ? rfq.category.nameAr : rfq.category.nameEn}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                    <Package className="h-3 w-3" />
                    {rfq.quantity.toLocaleString()} {rfq.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  {!rfq.budgetUndisclosed && rfq.budget ? (
                    <span className="text-sm font-bold text-brand-700">
                      {Number(rfq.budget).toLocaleString()} <span className="text-xs font-normal text-slate-400">{rfq.currency}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">{ar ? 'الميزانية غير محددة' : 'Budget undisclosed'}</span>
                  )}
                  {isBuyer ? (
                    <Link
                      href={`/${locale}/dashboard/buyer/rfqs/new`}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 transition-colors"
                    >
                      {ar ? 'انشر طلبك' : 'Post Similar'}
                      <PlusCircle className="h-3 w-3" />
                    </Link>
                  ) : (
                    <Link
                      href={`/${locale}/dashboard/rfqs`}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 transition-colors"
                    >
                      {ar ? 'قدّم عرضاً' : 'Submit Quote'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SiteFooter({ ar, locale }: { ar: boolean; locale: string }) {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 gap-8 mb-12 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700">
                <span className="text-sm font-bold text-white">م</span>
              </div>
              <span className="text-lg font-bold text-white">{ar ? 'موازن' : 'Mwazn'}</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              {ar
                ? 'طبقة القرار الذكية لسوق التوريد في المملكة العربية السعودية.'
                : 'The Smart Decision Layer for Saudi Supply Markets.'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{ar ? 'المنصة' : 'Platform'}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href={`/${locale}/suppliers`} className="hover:text-white transition-colors">{ar ? 'الموردون' : 'Suppliers'}</Link></li>
              <li><Link href={`/${locale}/auth/register?type=BUYER`} className="hover:text-white transition-colors">{ar ? 'أنشر طلب عرض' : 'Post RFQ'}</Link></li>
              <li><Link href={`/${locale}/auth/register?type=SUPPLIER`} className="hover:text-white transition-colors">{ar ? 'انضم كمورّد' : 'Join as Supplier'}</Link></li>
              <li><Link href={`/${locale}#why`} className="hover:text-white transition-colors">{ar ? 'لماذا موازن' : 'Why Mwazn'}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{ar ? 'للمشترين' : 'For Buyers'}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href={`/${locale}/auth/register?type=BUYER`} className="hover:text-white transition-colors">{ar ? 'إنشاء حساب' : 'Create Account'}</Link></li>
              <li><Link href={`/${locale}/auth/login`} className="hover:text-white transition-colors">{ar ? 'تسجيل الدخول' : 'Login'}</Link></li>
              <li><Link href={`/${locale}#why`} className="hover:text-white transition-colors">{ar ? 'المزايا' : 'Features'}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{ar ? 'للموردين' : 'For Suppliers'}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href={`/${locale}/auth/register?type=SUPPLIER`} className="hover:text-white transition-colors">{ar ? 'التسجيل كمورّد' : 'Register as Supplier'}</Link></li>
              <li><Link href={`/${locale}/dashboard/subscription`} className="hover:text-white transition-colors">{ar ? 'خطة PRO' : 'PRO Plan'}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© 2026 Mwazn. {ar ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              {ar ? 'الخوادم تعمل' : 'All systems operational'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HomeSections({ stats, suppliers, products, showrooms, rfqs }: Props) {
  const locale = useLocale();
  const ar = locale === 'ar';
  const router = useRouter();
  const { user, company, isLoading } = useAuth();

  // Platform admins belong in the admin workspace, not the public homepage.
  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role === 'PLATFORM_ADMIN') {
      router.replace(`/${locale}/dashboard/admin`);
    }
  }, [isLoading, user, locale, router]);

  // Minimal spinner while auth state resolves (avoids marketing flash for logged-in users)
  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  // Admin redirect in-flight
  if (user?.role === 'PLATFORM_ADMIN') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center gap-2 text-slate-500 text-sm">
        <Loader2 className="h-5 w-5 animate-spin" />
        {ar ? 'جارٍ التحميل…' : 'Loading…'}
      </div>
    );
  }

  // ── Signed-in buyer / supplier — personalized home ──────────────────────────
  if (user) {
    const isBuyer = user.role === 'BUYER_ADMIN' || user.role === 'CUSTOMER';
    const isCustomer = user.role === 'CUSTOMER';
    const isFreelancerUser = user.role === 'FREELANCER';
    const displayName = ar
      ? (company?.nameAr || user.fullName || user.email)
      : (company?.nameEn || user.fullName || user.email);

    return (
      <>
        {/* Personalized hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 pt-20 pb-16">
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          <div className="absolute -top-32 -end-32 h-[500px] w-[500px] rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute -bottom-20 -start-20 h-[400px] w-[400px] rounded-full blur-3xl" style={{ background: 'rgba(201,163,73,0.08)' }} />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-white/60 text-sm mb-2 tracking-wide">
              {ar ? 'مرحباً بعودتك' : 'Welcome back'}
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              {displayName}
            </h1>

            {/* Company badge */}
            {company && (
              <div className="inline-flex items-center gap-2 mb-8">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <Shield className="h-3 w-3" />
                  {company.isFreelancer
                    ? (ar ? 'بائع مستقل' : 'Independent Seller')
                    : (ar ? 'سجل تجاري موثّق' : 'CR Verified')}
                </span>
                {company.plan === 'PRO' && (
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: 'rgba(201,163,73,0.4)' }}>
                    PRO
                  </span>
                )}
              </div>
            )}

            {/* Quick actions */}
            {isCustomer ? (
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href={`/${locale}/dashboard/buyer/rfqs/new`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow-lift hover:bg-slate-50 transition-all hover:-translate-y-0.5"
                >
                  <PlusCircle className="h-4 w-4" />
                  {ar ? 'نشر طلب' : 'Post a Request'}
                </Link>
                <Link
                  href={`/${locale}/products`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
                >
                  <Package className="h-4 w-4" />
                  {ar ? 'تصفح المنتجات' : 'Browse Products'}
                </Link>
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {ar ? 'لوحة التحكم' : 'My Dashboard'}
                </Link>
              </div>
            ) : isFreelancerUser ? (
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href={`/${locale}/dashboard/supplier/rfqs`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow-lift hover:bg-slate-50 transition-all hover:-translate-y-0.5"
                >
                  <FileText className="h-4 w-4" />
                  {ar ? 'تصفح طلبات العروض' : 'Browse RFQs'}
                </Link>
                <Link
                  href={`/${locale}/dashboard/supplier/listings`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
                >
                  <Package className="h-4 w-4" />
                  {ar ? 'منتجاتي' : 'My Products'}
                </Link>
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {ar ? 'لوحة التحكم' : 'My Dashboard'}
                </Link>
              </div>
            ) : isBuyer ? (
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href={`/${locale}/dashboard/buyer/rfqs/new`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow-lift hover:bg-slate-50 transition-all hover:-translate-y-0.5"
                >
                  <PlusCircle className="h-4 w-4" />
                  {ar ? 'طلب عرض سعر جديد' : 'Post New RFQ'}
                </Link>
                <Link
                  href={`/${locale}/suppliers`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
                >
                  <Building2 className="h-4 w-4" />
                  {ar ? 'تصفح الموردين' : 'Browse Suppliers'}
                </Link>
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {ar ? 'لوحة التحكم' : 'My Dashboard'}
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href={`/${locale}/dashboard/supplier/rfqs`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow-lift hover:bg-slate-50 transition-all hover:-translate-y-0.5"
                >
                  <FileText className="h-4 w-4" />
                  {ar ? 'تصفح طلبات العروض' : 'Browse Open RFQs'}
                </Link>
                <Link
                  href={`/${locale}/dashboard/supplier/listings`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
                >
                  <Package className="h-4 w-4" />
                  {ar ? 'إدارة المنتجات' : 'Manage Products'}
                </Link>
                {company?.slug && (
                  <Link
                    href={`/${locale}/suppliers/${company.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    {ar ? 'معرضي' : 'My Showroom'}
                  </Link>
                )}
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {ar ? 'لوحة التحكم' : 'My Dashboard'}
                </Link>
              </div>
            )}
          </div>

          {/* Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 60L1440 60L1440 0C1200 48 240 48 0 0L0 60Z" fill="#F8FAFC" />
            </svg>
          </div>
        </section>

        {/* Marketplace content */}
        {products.length > 0 && <ProductsSection products={products} ar={ar} locale={locale} />}
        {suppliers.length > 0 && <SuppliersSection suppliers={suppliers} ar={ar} locale={locale} />}
        {showrooms.length > 0 && <ShowroomsSection showrooms={showrooms} ar={ar} locale={locale} />}
        {rfqs.length > 0 && <RFQsSection rfqs={rfqs} ar={ar} locale={locale} isBuyer={isBuyer} />}

        <SiteFooter ar={ar} locale={locale} />
      </>
    );
  }

  // ── Public (logged-out) homepage ─────────────────────────────────────────────
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        {/* Glow orbs */}
        <div className="absolute -top-32 -end-32 h-[500px] w-[500px] rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -start-20 h-[400px] w-[400px] rounded-full blur-3xl" style={{ background: 'rgba(201,163,73,0.08)' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center">
          {/* Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm text-white/80 mb-8 backdrop-blur">
            <Shield className="h-3.5 w-3.5" style={{ color: '#C9A349' }} />
            {ar ? 'طبقة القرار الذكية · موردون موثقون بالسجل التجاري' : 'Smart Decision Layer · CR-Verified Suppliers'}
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold text-white leading-[1.1] tracking-tight mb-5">
            {ar ? (
              <>
                طبقة القرار الذكية<br />
                <span style={{ color: '#C9A349' }}>لسوق التوريد في السعودية</span>
              </>
            ) : (
              <>
                The Smart Decision Layer<br />
                <span style={{ color: '#C9A349' }}>for Saudi Supply Markets</span>
              </>
            )}
          </h1>

          {/* Sub-headline */}
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-white/70 mb-10 leading-relaxed">
            {ar
              ? 'تواصل مع موردين سعوديين موثقين، احصل على عروض أسعار تنافسية في ساعات، واتخذ قرارات شراء مبنية على بيانات السوق الحقيقية.'
              : 'Discover verified Saudi suppliers, receive competitive quotes in hours, and make sourcing decisions backed by real market data.'}
          </p>

          {/* Public CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link
              href={`/${locale}/auth/register?type=BUYER`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-brand-800 shadow-lift hover:bg-slate-50 transition-all hover:-translate-y-0.5"
            >
              <FileText className="h-4 w-4" />
              {ar ? 'ابدأ طلب عرض سعر — مجاناً' : 'Post an RFQ — Free'}
            </Link>
            <Link
              href={`/${locale}/auth/register?type=SUPPLIER`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
            >
              <Building2 className="h-4 w-4" />
              {ar ? 'انضم كمورّد' : 'Join as Supplier'}
            </Link>
          </div>

          {/* Floating comparison mockup */}
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur overflow-hidden shadow-lift">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3 text-xs text-white/60">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                </div>
                <span className="ms-2">{ar ? 'موازن — مقارنة العروض' : 'Mwazn — Quote Comparison'}</span>
                <span className="ms-auto flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {ar ? 'مباشر' : 'Live'}
                </span>
              </div>
              {/* RFQ label row */}
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm">
                <FileText className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#C9A349' }} />
                <span className="text-white/80 font-medium">
                  {ar ? 'طلب عرض: أجهزة كمبيوتر وملحقاتها' : 'RFQ: Computer Equipment & Accessories'}
                </span>
                <span className="ms-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400 flex-shrink-0">
                  {ar ? '٣ عروض' : '3 quotes'}
                </span>
              </div>
              {/* Quote rows */}
              {MOCK_QUOTES.map((q, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-5 py-3.5 text-sm ${i < MOCK_QUOTES.length - 1 ? 'border-b border-white/[0.06]' : ''} ${q.tag === 'below' ? 'bg-emerald-500/[0.05]' : ''}`}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white/70">
                    {(ar ? q.nameAr : q.nameEn).charAt(0)}
                  </div>
                  <span className="flex-1 text-start text-white/80 font-medium truncate">
                    {ar ? q.nameAr : q.nameEn}
                  </span>
                  <span className="font-bold text-white">
                    {q.price} <span className="text-white/40 font-normal text-xs">SAR</span>
                  </span>
                  <PriceTag tag={q.tag} ar={ar} />
                </div>
              ))}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { icon: <FileText className="h-4 w-4" />, value: stats.totalRFQs > 0 ? stats.totalRFQs.toLocaleString() : '500+', labelEn: 'RFQs Posted', labelAr: 'طلب عروض' },
              { icon: <Building2 className="h-4 w-4" />, value: stats.totalVendors > 0 ? stats.totalVendors.toLocaleString() : '200+', labelEn: 'Verified Suppliers', labelAr: 'مورد موثق' },
              { icon: <Package className="h-4 w-4" />, value: stats.totalProducts > 0 ? stats.totalProducts.toLocaleString() : '5K+', labelEn: 'Active Products', labelAr: 'منتج نشط' },
              { icon: <HandshakeIcon className="h-4 w-4" />, value: stats.totalTransactions > 0 ? stats.totalTransactions.toLocaleString() : '1K+', labelEn: 'Deals Closed', labelAr: 'صفقة منجزة' },
            ].map((s) => (
              <div key={s.labelEn} className="rounded-xl border border-white/10 bg-white/[0.08] px-4 py-4 text-center backdrop-blur">
                <div className="flex justify-center mb-1.5" style={{ color: '#C9A349' }}>{s.icon}</div>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/50 mt-0.5">{ar ? s.labelAr : s.labelEn}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 0C1200 48 240 48 0 0L0 60Z" fill="#F8FAFC" />
          </svg>
        </div>
      </section>

      {/* ── Trust Bar ─────────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-slate-100 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {[
              { icon: <Shield className="h-3.5 w-3.5 text-emerald-600" />, textAr: 'توثيق السجل التجاري السعودي', textEn: 'Saudi CR-Verified Suppliers' },
              { icon: <BarChart3 className="h-3.5 w-3.5 text-brand-600" />, textAr: 'مقارنة أسعار السوق الفورية', textEn: 'Real-time Market Price Comparison' },
              { icon: <Star className="h-3.5 w-3.5 text-amber-500" />, textAr: 'تقييمات موثّقة من مشترين فعليين', textEn: 'Ratings from Verified Buyers' },
              { icon: <Award className="h-3.5 w-3.5 text-purple-600" />, textAr: 'منصة متخصصة في المشتريات B2B', textEn: 'Purpose-Built for B2B Procurement' },
              { icon: <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#C9A349' }} />, textAr: 'بدون رسوم للبدء', textEn: 'Free to Start' },
            ].map((item) => (
              <div key={item.textEn} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                {item.icon}
                <span>{ar ? item.textAr : item.textEn}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 mb-3">
              {ar ? 'كيف يعمل موازن' : 'How it works'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
              {ar ? 'من الطلب إلى الصفقة في ثلاث خطوات' : 'From request to deal in three steps'}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {ar
                ? 'موازن يبسّط المشتريات بين الشركات — من نشر الطلب إلى إغلاق الصفقة.'
                : 'Mwazn simplifies B2B procurement — from posting a request to closing the deal.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {[
              {
                step: '01', color: 'bg-brand-700',
                titleEn: 'Post an RFQ', titleAr: 'انشر طلب عرض سعر',
                descEn: 'Describe what you need — quantity, specs, and deadline. Attach drawings or BOQs for precise offers.',
                descAr: 'اصف ما تحتاجه — الكمية والمواصفات والموعد. أرفق مخططات أو جداول كميات للحصول على عروض دقيقة.',
              },
              {
                step: '02', color: 'bg-emerald-600',
                titleEn: 'Receive Verified Offers', titleAr: 'استقبل عروضاً من موردين موثقين',
                descEn: 'CR-verified Saudi suppliers respond with competitive prices, delivery timelines, and certifications — fast.',
                descAr: 'موردون سعوديون موثقون بالسجل التجاري يردون بأسعار تنافسية ومواعيد تسليم وشهادات — بسرعة.',
              },
              {
                step: '03', color: 'bg-amber-500',
                titleEn: 'Compare & Award', titleAr: 'قارن وارسِ',
                descEn: 'Side-by-side comparison with market price signals. Award the best offer in one click.',
                descAr: 'مقارنة جنباً إلى جنب مع مؤشرات أسعار السوق. أرسِ أفضل عرض بنقرة واحدة.',
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.color} text-white text-lg font-bold mb-5 shadow-md`}>
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{ar ? item.titleAr : item.titleEn}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{ar ? item.descAr : item.descEn}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href={`/${locale}/auth/register?type=BUYER`}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 transition-all"
            >
              {ar ? 'انشر أول طلب مجاناً' : 'Post your first RFQ — Free'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Mwazn ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface" id="why">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold mb-3"
              style={{ background: 'rgba(201,163,73,0.12)', color: '#8B6420' }}
            >
              {ar ? 'لماذا موازن؟' : 'Why Mwazn?'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
              {ar ? 'ليست مجرد سوق — بل طبقة قرار' : 'Not Just a Marketplace — A Decision Layer'}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base">
              {ar
                ? 'موازن يمنحك أدوات الذكاء التي تحتاجها لاتخاذ قرارات شراء مبنية على البيانات.'
                : 'Mwazn gives you the intelligence tools you need to make data-driven purchasing decisions.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Layers className="h-6 w-6" />,
                titleAr: 'مقارنة ذكية', titleEn: 'Smart Comparison',
                descAr: 'قارن عروضاً متعددة جنباً إلى جنب بالسعر والتسليم والتقييم — اتخذ القرار الصحيح.',
                descEn: 'Compare multiple quotes side-by-side by price, delivery, and rating — pick the right one.',
                border: '#1B4F8A', iconBg: 'rgba(27,79,138,0.08)', iconColor: '#1B4F8A',
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                titleAr: 'مؤشرات سعرية', titleEn: 'Price Indicators',
                descAr: 'اعرف على الفور إذا كان السعر أقل أو أعلى من متوسط السوق — وفّر ميزانيتك.',
                descEn: 'Know instantly if a price is below or above market average — protect your budget.',
                border: '#C9A349', iconBg: 'rgba(201,163,73,0.10)', iconColor: '#C9A349',
              },
              {
                icon: <Shield className="h-6 w-6" />,
                titleAr: 'موردون موثقون', titleEn: 'Verified Suppliers',
                descAr: 'كل مورد موثق بالسجل التجاري السعودي ومُقيَّم من مشترين فعليين.',
                descEn: 'Every supplier is verified by Saudi Commercial Registration and rated by real buyers.',
                border: '#10B981', iconBg: 'rgba(16,185,129,0.08)', iconColor: '#10B981',
              },
              {
                icon: <Activity className="h-6 w-6" />,
                titleAr: 'رؤية كاملة', titleEn: 'Full Visibility',
                descAr: 'تابع كل صفقة من طلب العرض حتى التسليم — لا غموض في أي مرحلة.',
                descEn: 'Track every deal from RFQ to delivery — no ambiguity at any stage.',
                border: '#8B5CF6', iconBg: 'rgba(139,92,246,0.08)', iconColor: '#8B5CF6',
              },
            ].map((feat) => (
              <div
                key={feat.titleEn}
                className="card card-hover group flex flex-col relative overflow-hidden"
              >
                <div
                  className="absolute top-0 start-0 end-0 h-[3px] rounded-t-2xl"
                  style={{ background: feat.border }}
                />
                <div
                  className="mb-5 mt-2 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: feat.iconBg, color: feat.iconColor }}
                >
                  {feat.icon}
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{ar ? feat.titleAr : feat.titleEn}</h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">
                  {ar ? feat.descAr : feat.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace sections */}
      {products.length > 0 && <ProductsSection products={products} ar={ar} locale={locale} />}
      {suppliers.length > 0 && <SuppliersSection suppliers={suppliers} ar={ar} locale={locale} />}
      {showrooms.length > 0 && <ShowroomsSection showrooms={showrooms} ar={ar} locale={locale} />}

      {/* ── Latest Open RFQs (public — encourages supplier sign-up) ──────────── */}
      {rfqs.length > 0 && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {ar ? 'أحدث الفرص' : 'Latest Opportunities'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {ar ? 'طلبات عروض الأسعار المفتوحة' : 'Open Requests for Quotation'}
                </h2>
              </div>
              <Link
                href={`/${locale}/auth/register?type=SUPPLIER`}
                className="hidden items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 sm:inline-flex"
              >
                {ar ? 'قدّم عرضك' : 'Submit a Quote'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rfqs.map((rfq) => {
                const daysLeft = Math.max(0, Math.ceil((new Date(rfq.deadline).getTime() - Date.now()) / 86400_000));
                const urgency = daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low';
                return (
                  <div key={rfq.id} className="card flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        urgency === 'high' ? 'bg-red-50 text-red-700' :
                        urgency === 'medium' ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {daysLeft === 0 ? (ar ? 'ينتهي اليوم' : 'Ends today') :
                           ar ? `${daysLeft} يوم متبقٍ` : `${daysLeft}d left`}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                        <Users className="h-3 w-3" />
                        {rfq._count.quotes} {ar ? 'عروض' : 'quotes'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1 leading-snug">
                        {rfq.title}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {ar ? rfq.buyer.nameAr : rfq.buyer.nameEn}
                        {rfq.buyer.city ? ` · ${rfq.buyer.city}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                        <Tag className="h-3 w-3" />
                        {ar ? rfq.category.nameAr : rfq.category.nameEn}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                        <Package className="h-3 w-3" />
                        {rfq.quantity.toLocaleString()} {rfq.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      {!rfq.budgetUndisclosed && rfq.budget ? (
                        <span className="text-sm font-bold text-brand-700">
                          {Number(rfq.budget).toLocaleString()} <span className="text-xs font-normal text-slate-400">{rfq.currency}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">{ar ? 'الميزانية غير محددة' : 'Budget undisclosed'}</span>
                      )}
                      <Link
                        href={`/${locale}/auth/register?type=SUPPLIER`}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 transition-colors"
                      >
                        {ar ? 'قدّم عرضاً' : 'Submit Quote'}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/auth/register?type=SUPPLIER`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-800"
              >
                <Building2 className="h-4 w-4" />
                {ar ? 'سجّل وقدّم عروضك' : 'Register & Start Quoting'}
              </Link>
              <Link
                href={`/${locale}/auth/register?type=BUYER`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-50"
              >
                <FileText className="h-4 w-4" />
                {ar ? 'انشر طلب عرض سعر' : 'Post Your Own RFQ'}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24"
        style={{ background: 'linear-gradient(135deg, #1E2D4D 0%, #1B4F8A 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="absolute end-0 top-0 h-80 w-80 rounded-full blur-3xl" style={{ background: 'rgba(201,163,73,0.08)' }} />
        <div className="absolute -start-20 bottom-0 h-64 w-64 rounded-full blur-3xl opacity-10" style={{ background: '#fff' }} />
        <div className="relative mx-auto max-w-5xl px-4">
          <div className="text-center mb-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {ar ? 'مجاني للبدء — لا بطاقة ائتمان' : 'Free to start — no credit card required'}
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {ar ? 'موازن يخدم طرفَي السوق' : 'Built for Both Sides of the Market'}
            </h2>
            <p className="mx-auto max-w-xl text-lg text-white/70">
              {ar
                ? 'سواء كنت تشتري أو تبيع، موازن يمنحك ذكاء السوق الذي تحتاجه للفوز بكل صفقة.'
                : 'Whether you source or supply, Mwazn gives you the market intelligence to win every deal.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {/* Buyer CTA */}
            <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide font-semibold">{ar ? 'للمشترين' : 'For Buyers'}</p>
                  <p className="text-sm font-bold text-white">{ar ? 'اشترِ بذكاء' : 'Source Smarter'}</p>
                </div>
              </div>
              <ul className="space-y-1.5 mb-5">
                {(ar ? [
                  'انشر طلب ويصلك عروض خلال ساعات',
                  'قارن الأسعار بمؤشرات السوق الحقيقية',
                  'موردون موثقون بالسجل التجاري فقط',
                ] : [
                  'Post an RFQ and get quotes within hours',
                  'Compare prices against real market signals',
                  'Only CR-verified Saudi suppliers',
                ]).map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-sm text-white/80">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>
              <Link
                href={`/${locale}/auth/register?type=BUYER`}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 w-full"
              >
                <ShoppingBag className="h-4 w-4" />
                {ar ? 'سجّل كمشترٍ — مجاناً' : 'Register as Buyer — Free'}
              </Link>
            </div>
            {/* Supplier CTA */}
            <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide font-semibold">{ar ? 'للموردين' : 'For Suppliers'}</p>
                  <p className="text-sm font-bold text-white">{ar ? 'نمّ عملك' : 'Grow Your Business'}</p>
                </div>
              </div>
              <ul className="space-y-1.5 mb-5">
                {(ar ? [
                  'تصفح طلبات أسعار مفتوحة من مشترين سعوديين',
                  'أنشئ معرضاً احترافياً موثّقاً',
                  'ابنِ سمعتك بتقييمات المشترين الحقيقيين',
                ] : [
                  'Browse open RFQs from Saudi buyers',
                  'Build a verified professional showroom',
                  'Grow trust through real buyer ratings',
                ]).map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-sm text-white/80">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>
              <Link
                href={`/${locale}/auth/register?type=SUPPLIER`}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/15 px-6 py-3 font-semibold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/25 w-full"
              >
                <Building2 className="h-4 w-4" />
                {ar ? 'انضم كمورّد' : 'Join as Supplier'}
              </Link>
            </div>
          </div>
          {stats.totalVendors > 0 && (
            <p className="mt-10 text-center text-sm text-white/50">
              {ar
                ? `${stats.totalVendors.toLocaleString()} مورد موثق · ${stats.totalRFQs.toLocaleString()} طلب عرض أسعار · ${stats.totalTransactions.toLocaleString()} صفقة منجزة`
                : `${stats.totalVendors.toLocaleString()} verified suppliers · ${stats.totalRFQs.toLocaleString()} RFQs posted · ${stats.totalTransactions.toLocaleString()} deals closed`}
            </p>
          )}
        </div>
      </section>

      <SiteFooter ar={ar} locale={locale} />
    </>
  );
}
