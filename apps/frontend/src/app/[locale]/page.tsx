import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBar } from '@/components/ui/SearchBar';
import { StarRating } from '@/components/ui/StarRating';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowRight, CheckCircle2, FileText, BarChart3, MessageSquare,
  Star, Shield, TrendingUp, Building2, Package, ChevronRight,
  Zap, Globe2, Award, Users, ShoppingBag, HandshakeIcon,
  ArrowUpRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stat { totalRFQs: number; totalVendors: number; totalProducts: number; totalTransactions: number; }
interface Vendor {
  id: string; nameEn: string; nameAr: string; city: string | null;
  plan: string; slug: string | null; logoUrl: string | null;
  averageRating: number; totalRatings: number;
  _count: { listings: number };
}
interface Product {
  id: string; titleEn: string; titleAr: string; price: string | null;
  currency: string; unit: string | null;
  supplier: { id: string; nameEn: string; nameAr: string; slug: string | null };
  category: { nameEn: string; nameAr: string };
  images: Array<{ url: string }>;
  _count: { quotes: number };
}
interface Showroom extends Vendor {
  listings: Array<{ id: string; titleEn: string; titleAr: string; images: Array<{ url: string }> }>;
}

// ─── Data Fetching ─────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch { return null; }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const locale = await getLocale();
  const ar = locale === 'ar';

  const [stats, vendors, products, showrooms] = await Promise.all([
    fetchJSON<Stat>('/marketplace/stats'),
    fetchJSON<Vendor[]>('/marketplace/top-vendors?limit=8'),
    fetchJSON<Product[]>('/marketplace/top-products?limit=8'),
    fetchJSON<Showroom[]>('/marketplace/featured-showrooms?limit=6'),
  ]);

  const safeStats: Stat = stats ?? { totalRFQs: 0, totalVendors: 0, totalProducts: 0, totalTransactions: 0 };
  const safeVendors: Vendor[] = vendors ?? [];
  const safeProducts: Product[] = products ?? [];
  const safeShowrooms: Showroom[] = showrooms ?? [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gold-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 mb-8 backdrop-blur border border-white/10">
            <Shield className="h-3.5 w-3.5 text-gold-400" />
            {ar ? 'موردون موثقون بالسجل التجاري' : 'CR-verified suppliers only'}
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            {ar ? (
              <>
                سوق <span className="text-gold-400">B2B</span><br />
                الذكي للمملكة العربية السعودية
              </>
            ) : (
              <>
                Saudi Arabia's Smart<br />
                <span className="text-gold-400">B2B Procurement</span> Marketplace
              </>
            )}
          </h1>

          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-white/70 mb-10 leading-relaxed">
            {ar
              ? 'أنشر طلبات الأسعار، واستقبل عروضاً من موردين موثقين، وأتمم صفقاتك — كل ذلك في منصة واحدة متكاملة.'
              : 'Post RFQs, receive competitive quotes from verified suppliers, and close deals — all in one intelligent platform.'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href={`/${locale}/auth/register?type=BUYER`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-brand-700 shadow-lift hover:bg-slate-50 transition-all hover:-translate-y-0.5"
            >
              <FileText className="h-4 w-4" />
              {ar ? 'أنشر طلب عرض أسعار' : 'Raise an RFQ'}
            </Link>
            <Link
              href={`/${locale}/suppliers`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
            >
              <Building2 className="h-4 w-4" />
              {ar ? 'تصفح الموردين' : 'Browse Vendors'}
            </Link>
            <Link
              href={`/${locale}/suppliers?tab=products`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-400/20 border border-gold-400/30 px-7 py-3.5 text-sm font-semibold text-gold-300 hover:bg-gold-400/30 transition-all hover:-translate-y-0.5 backdrop-blur"
            >
              <Package className="h-4 w-4" />
              {ar ? 'استكشف المنتجات' : 'Explore Products'}
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mx-auto max-w-2xl">
            <SearchBar size="lg" className="text-slate-800" />
            <p className="mt-3 text-xs text-white/40">
              {ar ? 'ابحث عن موردين، منتجات، فئات...' : 'Search 25+ categories, 240+ products, verified suppliers'}
            </p>
          </div>

          {/* Live Stats Strip */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: <FileText className="h-5 w-5" />, value: safeStats.totalRFQs.toLocaleString(), labelEn: 'Total RFQs', labelAr: 'طلبات عروض' },
              { icon: <Building2 className="h-5 w-5" />, value: safeStats.totalVendors.toLocaleString(), labelEn: 'Verified Vendors', labelAr: 'مورد موثق' },
              { icon: <Package className="h-5 w-5" />, value: safeStats.totalProducts.toLocaleString(), labelEn: 'Active Products', labelAr: 'منتج نشط' },
              { icon: <HandshakeIcon className="h-5 w-5" />, value: safeStats.totalTransactions.toLocaleString(), labelEn: 'Transactions', labelAr: 'صفقة منجزة' },
            ].map((s) => (
              <div key={s.labelEn} className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur px-4 py-5 text-center">
                <div className="flex justify-center mb-2 text-gold-400">{s.icon}</div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/60 mt-0.5">{ar ? s.labelAr : s.labelEn}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 72L1440 72L1440 0C1200 55 240 55 0 0L0 72Z" fill="#F8FAFC" />
          </svg>
        </div>
      </section>

      {/* ── Trust Strip ───────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-slate-100 py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {[
              { icon: <Shield className="h-4 w-4 text-emerald-600" />, text: ar ? 'توثيق السجل التجاري' : 'CR Verified Suppliers' },
              { icon: <Award className="h-4 w-4 text-brand-600" />, text: ar ? 'نظام تقييم موثوق' : 'Trusted Rating System' },
              { icon: <Zap className="h-4 w-4 text-gold-500" />, text: ar ? 'طلبات عروض سريعة' : 'Fast RFQ Process' },
              { icon: <Globe2 className="h-4 w-4 text-purple-600" />, text: ar ? 'ثنائي اللغة AR/EN' : 'Bilingual AR/EN Platform' },
              { icon: <Users className="h-4 w-4 text-slate-600" />, text: ar ? 'شركات سعودية موثوقة' : 'Saudi-Registered Companies' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-slate-600">
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 mb-3">
              {ar ? 'آلية العمل' : 'How It Works'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
              {ar ? 'من الطلب إلى الصفقة في 3 خطوات' : 'From Request to Deal in 3 Steps'}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {ar
                ? 'منصة موازن تبسّط دورة الشراء B2B بالكامل — من نشر الطلب حتى إتمام الصفقة.'
                : 'Mwazn simplifies the entire B2B procurement cycle — from posting to closing.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-brand-200 to-transparent" />

            {[
              {
                n: '01',
                icon: <FileText className="h-7 w-7" />,
                titleEn: 'Post an RFQ',
                titleAr: 'انشر طلب عرض أسعار',
                descEn: 'Describe your requirements, set your budget and deadline. Takes 2 minutes.',
                descAr: 'صف متطلباتك وحدد ميزانيتك وموعدك النهائي. يستغرق دقيقتين فقط.',
                color: 'bg-brand-700 text-white',
              },
              {
                n: '02',
                icon: <BarChart3 className="h-7 w-7" />,
                titleEn: 'Compare Quotes',
                titleAr: 'قارن العروض',
                descEn: 'Verified suppliers submit competitive offers. Compare side-by-side.',
                descAr: 'يتقدم الموردون الموثقون بأفضل عروضهم. قارن بينها بسهولة.',
                color: 'bg-gold-400 text-white',
              },
              {
                n: '03',
                icon: <Award className="h-7 w-7" />,
                titleEn: 'Award & Track',
                titleAr: 'ارسِ وتابع',
                descEn: 'Accept the best quote, track the deal lifecycle, then rate your supplier.',
                descAr: 'اقبل أفضل عرض وتابع مراحل الصفقة ثم قيّم مورّدك.',
                color: 'bg-emerald-500 text-white',
              },
            ].map((step) => (
              <div key={step.n} className="card card-hover relative text-center group">
                <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${step.color}`}>
                  {step.icon}
                </div>
                <div className="absolute top-4 end-4 text-5xl font-black text-slate-50 select-none">{step.n}</div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {ar ? step.titleAr : step.titleEn}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {ar ? step.descAr : step.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Products ──────────────────────────────────────────────────── */}
      {safeProducts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="inline-block rounded-full bg-gold-400/10 px-3 py-1 text-xs font-semibold text-gold-600 mb-2">
                  {ar ? 'المنتجات الأكثر طلباً' : 'Most Requested Products'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {ar ? 'منتجات مميزة من موردين موثقين' : 'Featured Products from Verified Suppliers'}
                </h2>
              </div>
              <Link
                href={`/${locale}/suppliers`}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
              >
                {ar ? 'عرض الكل' : 'View All'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {safeProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/${locale}/suppliers/${product.supplier.slug ?? product.supplier.id}`}
                  className="group card card-hover p-0 overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative h-44 bg-slate-50 overflow-hidden">
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt={product.titleEn}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-slate-200" />
                      </div>
                    )}
                    <div className="absolute top-2 start-2">
                      <span className="rounded-lg bg-white/90 backdrop-blur px-2 py-0.5 text-xs font-medium text-slate-600">
                        {ar ? product.category.nameAr : product.category.nameEn}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1">
                      {ar ? product.titleAr : product.titleEn}
                    </p>
                    <p className="text-xs text-slate-400 mb-3 truncate">
                      {ar ? product.supplier.nameAr : product.supplier.nameEn}
                    </p>
                    <div className="flex items-center justify-between">
                      {product.price ? (
                        <span className="text-sm font-bold text-brand-700">
                          {Number(product.price).toLocaleString()} {product.currency}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">{ar ? 'استفسر للسعر' : 'Request quote'}</span>
                      )}
                      {product._count.quotes > 0 && (
                        <span className="text-xs text-slate-400">{product._count.quotes} {ar ? 'عرض' : 'quotes'}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Top Rated Vendors ─────────────────────────────────────────────── */}
      {safeVendors.length > 0 && (
        <section className="py-20 bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 mb-2">
                  {ar ? 'أعلى الموردين تقييماً' : 'Top Rated Vendors'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {ar ? 'موردون موثقون وذوو سمعة عالية' : 'Verified & Highly-Rated Suppliers'}
                </h2>
              </div>
              <Link
                href={`/${locale}/suppliers`}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
              >
                {ar ? 'عرض الكل' : 'View All'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {safeVendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/${locale}/suppliers/${vendor.slug ?? vendor.id}`}
                  className="card card-hover group flex flex-col"
                >
                  {/* Logo / Avatar */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 text-lg font-bold">
                      {vendor.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={vendor.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                      ) : (
                        (ar ? vendor.nameAr : vendor.nameEn).charAt(0)
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {vendor.plan === 'PRO' && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">PRO</span>
                      )}
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {ar ? 'موثق' : 'Verified'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-brand-700 transition-colors line-clamp-2">
                    {ar ? vendor.nameAr : vendor.nameEn}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">{vendor.city}</p>

                  {/* Rating */}
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <StarRating score={vendor.averageRating} />
                      <span className="text-xs font-semibold text-slate-700">{vendor.averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {vendor._count.listings} {ar ? 'منتج' : 'products'}
                    </span>
                  </div>
                  {vendor.totalRatings > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      {vendor.totalRatings} {ar ? 'تقييم' : 'reviews'}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Showrooms ────────────────────────────────────────────── */}
      {safeShowrooms.length > 0 && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 mb-2">
                  {ar ? 'معارض المورّدين' : 'Featured Showrooms'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {ar ? 'تصفح معارض الموردين المميزين' : 'Browse Premium Supplier Showrooms'}
                </h2>
              </div>
              <Link
                href={`/${locale}/suppliers`}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
              >
                {ar ? 'عرض الكل' : 'View All'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {safeShowrooms.map((showroom) => (
                <Link
                  key={showroom.id}
                  href={`/${locale}/suppliers/${showroom.slug ?? showroom.id}`}
                  className="card card-hover group p-0 overflow-hidden"
                >
                  {/* Product image strip */}
                  <div className="grid grid-cols-4 h-24 bg-slate-50">
                    {showroom.listings.slice(0, 4).map((listing, i) =>
                      listing.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={listing.id}
                          src={listing.images[0].url}
                          alt={listing.titleEn}
                          className={`h-24 w-full object-cover ${i === 0 ? '' : 'border-s border-white'} transition-opacity group-hover:opacity-90`}
                        />
                      ) : (
                        <div key={listing.id} className="h-24 bg-slate-100 flex items-center justify-center border-s border-white">
                          <Package className="h-5 w-5 text-slate-300" />
                        </div>
                      )
                    )}
                    {showroom.listings.length === 0 && (
                      <div className="col-span-4 h-24 flex items-center justify-center bg-slate-50">
                        <Building2 className="h-10 w-10 text-slate-200" />
                      </div>
                    )}
                  </div>

                  {/* Company info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800 group-hover:text-brand-700 transition-colors">
                          {ar ? showroom.nameAr : showroom.nameEn}
                        </h3>
                        <p className="text-xs text-slate-400">{showroom.city}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {showroom.plan === 'PRO' && (
                          <Badge variant="purple">PRO</Badge>
                        )}
                        <Badge variant="green">{ar ? 'موثق' : 'Verified'}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <StarRating score={showroom.averageRating} />
                        <span className="font-semibold text-slate-700">{showroom.averageRating.toFixed(1)}</span>
                        {showroom.totalRatings > 0 && (
                          <span className="text-slate-400">({showroom.totalRatings})</span>
                        )}
                      </div>
                      <span className="text-brand-700 font-semibold flex items-center gap-1">
                        {ar ? 'زيارة المعرض' : 'View Showroom'}
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Platform Features ─────────────────────────────────────────────── */}
      <section className="py-20 bg-surface" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 mb-3">
              {ar ? 'لماذا موازن؟' : 'Why Mwazn?'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
              {ar ? 'كل ما تحتاجه لإدارة مشترياتك' : 'Everything you need for B2B procurement'}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {ar
                ? 'منصة متكاملة تجمع الموردين والمشترين في تجربة سلسة ومؤمنة.'
                : 'A complete platform connecting buyers and suppliers in a seamless, secure experience.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <FileText className="h-6 w-6" />,
                color: 'bg-brand-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white',
                titleEn: 'Smart RFQ System', titleAr: 'نظام طلبات ذكي',
                descEn: 'Create detailed RFQs with attachments and receive competitive quotes from verified suppliers within hours.',
                descAr: 'أنشئ طلبات عروض مفصّلة واستقبل عروضاً تنافسية من موردين موثقين في غضون ساعات.',
              },
              {
                icon: <Shield className="h-6 w-6" />,
                color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
                titleEn: 'CR-Verified Suppliers', titleAr: 'موردون موثقو السجل',
                descEn: 'Every supplier is manually verified against their Saudi Commercial Registration — no fakes.',
                descAr: 'كل مورد يُتحقق منه يدوياً بموجب سجله التجاري السعودي — لا وجود لموردين مزيّفين.',
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                color: 'bg-gold-400/10 text-gold-600 group-hover:bg-gold-400 group-hover:text-white',
                titleEn: 'Side-by-Side Comparison', titleAr: 'مقارنة العروض',
                descEn: 'Compare quotes side by side by price, delivery time, and supplier rating to make data-driven decisions.',
                descAr: 'قارن العروض جنباً إلى جنب بالسعر ومدة التسليم وتقييم المورد.',
              },
              {
                icon: <MessageSquare className="h-6 w-6" />,
                color: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
                titleEn: 'Built-in Messaging', titleAr: 'مراسلة داخلية',
                descEn: 'Direct communication between buyers and suppliers — all within the platform, traceable and archived.',
                descAr: 'تواصل مباشر بين المشترين والموردين داخل المنصة، قابل للتتبع والأرشفة.',
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                color: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
                titleEn: 'Full Deal Lifecycle', titleAr: 'دورة الصفقة الكاملة',
                descEn: 'Track every deal from award to delivery to completion. Full visibility at every step.',
                descAr: 'تابع كل صفقة من الإرساء حتى التسليم والإتمام. رؤية كاملة في كل مرحلة.',
              },
              {
                icon: <Star className="h-6 w-6" />,
                color: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
                titleEn: 'Trust & Ratings', titleAr: 'الثقة والتقييمات',
                descEn: 'Rate suppliers after deal completion. Build a reputation-driven marketplace ecosystem.',
                descAr: 'قيّم الموردين بعد إتمام الصفقة. ابنِ سوقاً قائماً على السمعة والثقة.',
              },
            ].map((feat) => (
              <div key={feat.titleEn} className="card card-hover group">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${feat.color}`}>
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-slate-800 mb-2 text-lg">
                  {ar ? feat.titleAr : feat.titleEn}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {ar ? feat.descAr : feat.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-brand-900 to-brand-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 mb-6">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {ar ? 'مجاني للبدء — لا بطاقة ائتمان' : 'Free to start — no credit card required'}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {ar ? 'هل أنت جاهز لتحسين مشترياتك؟' : 'Ready to transform your procurement?'}
          </h2>
          <p className="text-white/70 mb-10 text-lg max-w-xl mx-auto">
            {ar
              ? 'انضم إلى مئات الشركات السعودية التي تستخدم موازن لتبسيط مشترياتها.'
              : 'Join hundreds of Saudi companies using Mwazn to streamline B2B purchasing.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/auth/register?type=BUYER`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-brand-700 hover:bg-slate-50 transition-all hover:-translate-y-0.5"
            >
              <ShoppingBag className="h-5 w-5" />
              {ar ? 'سجّل كمشترٍ مجاناً' : 'Register as Buyer — Free'}
            </Link>
            <Link
              href={`/${locale}/auth/register?type=SUPPLIER`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-8 py-3.5 font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
            >
              <Building2 className="h-5 w-5" />
              {ar ? 'انضم كمورّد' : 'Join as Supplier'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700">
                  <span className="text-sm font-bold text-white">م</span>
                </div>
                <span className="text-lg font-bold text-white">
                  {ar ? 'موازن' : 'Mwazn'}
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                {ar
                  ? 'منصة الشراء B2B الأذكى في المملكة العربية السعودية.'
                  : "Saudi Arabia's smartest B2B procurement marketplace."}
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">{ar ? 'المنصة' : 'Platform'}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href={`/${locale}/suppliers`} className="hover:text-white transition-colors">{ar ? 'الموردون' : 'Suppliers'}</Link></li>
                <li><Link href={`/${locale}/auth/register?type=BUYER`} className="hover:text-white transition-colors">{ar ? 'أنشر طلب عرض' : 'Post RFQ'}</Link></li>
                <li><Link href={`/${locale}/auth/register?type=SUPPLIER`} className="hover:text-white transition-colors">{ar ? 'انضم كمورّد' : 'Join as Supplier'}</Link></li>
                <li><Link href={`/${locale}#how-it-works`} className="hover:text-white transition-colors">{ar ? 'كيف يعمل' : 'How It Works'}</Link></li>
              </ul>
            </div>

            {/* For Buyers */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">{ar ? 'للمشترين' : 'For Buyers'}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href={`/${locale}/auth/register?type=BUYER`} className="hover:text-white transition-colors">{ar ? 'إنشاء حساب' : 'Create Account'}</Link></li>
                <li><Link href={`/${locale}/auth/login`} className="hover:text-white transition-colors">{ar ? 'تسجيل الدخول' : 'Login'}</Link></li>
                <li><Link href={`/${locale}#features`} className="hover:text-white transition-colors">{ar ? 'المزايا' : 'Features'}</Link></li>
              </ul>
            </div>

            {/* For Suppliers */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">{ar ? 'للموردين' : 'For Suppliers'}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href={`/${locale}/auth/register?type=SUPPLIER`} className="hover:text-white transition-colors">{ar ? 'التسجيل كمورّد' : 'Register as Supplier'}</Link></li>
                <li><Link href={`/${locale}/dashboard/subscription`} className="hover:text-white transition-colors">{ar ? 'خطة PRO' : 'PRO Plan'}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">
              © 2026 Mwazn. {ar ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                {ar ? 'الخوادم تعمل' : 'All systems operational'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
