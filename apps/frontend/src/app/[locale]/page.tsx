import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { HeroCTA } from './HeroCTA';

export const metadata: Metadata = {
  title: 'Mwazn | موازن — Saudi B2B Procurement Marketplace',
  description: "Saudi Arabia's premier B2B marketplace — connect with verified suppliers, post RFQs, and close deals faster. منصة المشتريات B2B السعودية الرائدة.",
  openGraph: {
    title: 'Mwazn | موازن — Saudi B2B Procurement Marketplace',
    description: "Connect with verified Saudi suppliers and post procurement requests on Mwazn.",
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ar_SA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mwazn | موازن — Saudi B2B Marketplace',
    description: "Saudi Arabia's premier B2B procurement platform.",
  },
};
import { StarRating } from '@/components/ui/StarRating';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowRight, CheckCircle2, FileText, BarChart3,
  Shield, TrendingUp, TrendingDown, Building2, Package,
  Award, ShoppingBag, HandshakeIcon, ArrowUpRight,
  Minus, Activity, Layers, Clock, Tag,
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
interface LatestRFQ {
  id: string; title: string; quantity: number; unit: string;
  budget: string | null; budgetUndisclosed: boolean; currency: string;
  deadline: string; createdAt: string;
  category: { nameEn: string; nameAr: string; slug: string };
  buyer: { nameEn: string; nameAr: string; city: string | null };
  _count: { quotes: number };
}

// ─── Static mock data for comparison preview ──────────────────────────────────

const MOCK_QUOTES: Array<{
  nameAr: string; nameEn: string; price: string;
  delivery: number; rating: number; tag: 'below' | 'above' | 'market';
}> = [
  { nameAr: 'شركة الرياض التقنية', nameEn: 'Riyadh Tech Co.', price: '230', delivery: 3, rating: 4.8, tag: 'below' },
  { nameAr: 'مؤسسة الخليج الرقمي', nameEn: 'Gulf Digital Est.', price: '295', delivery: 5, rating: 4.2, tag: 'above' },
  { nameAr: 'تقنية النجم السعودي', nameEn: 'Star Saudi Tech', price: '258', delivery: 4, rating: 4.5, tag: 'market' },
];

// ─── Data Fetching ─────────────────────────────────────────────────────────────

// Server components: prefer internal Docker network URL, fall back to public URL
const API = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch { return null; }
}

// ─── Price Tag ───────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const locale = await getLocale();
  const ar = locale === 'ar';

  const [stats, vendors, products, showrooms, latestRFQs] = await Promise.all([
    fetchJSON<Stat>('/marketplace/stats'),
    fetchJSON<Vendor[]>('/marketplace/top-vendors?limit=8'),
    fetchJSON<Product[]>('/marketplace/top-products?limit=8'),
    fetchJSON<Showroom[]>('/marketplace/featured-showrooms?limit=6'),
    fetchJSON<LatestRFQ[]>('/marketplace/latest-rfqs?limit=6'),
  ]);

  const safeStats: Stat = stats ?? { totalRFQs: 0, totalVendors: 0, totalProducts: 0, totalTransactions: 0 };
  const safeVendors: Vendor[] = vendors ?? [];
  const safeProducts: Product[] = products ?? [];
  const safeShowrooms: Showroom[] = showrooms ?? [];
  const safeRFQs: LatestRFQ[] = latestRFQs ?? [];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
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
              ? 'قارن الموردين، تحقق من مؤشرات الأسعار، واتخذ قرارات شراء أكثر ذكاءً — في منصة واحدة متكاملة.'
              : 'Compare suppliers, verify price indicators, and make smarter purchasing decisions — all in one intelligent platform.'}
          </p>

          {/* CTAs */}
          <HeroCTA />

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
                <span className="ms-2">{ar ? 'معيار — مقارنة العروض' : 'Mwazn — Quote Comparison'}</span>
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
              { icon: <FileText className="h-4 w-4" />, value: safeStats.totalRFQs > 0 ? safeStats.totalRFQs.toLocaleString() : '500+', labelEn: 'RFQs Posted', labelAr: 'طلب عروض' },
              { icon: <Building2 className="h-4 w-4" />, value: safeStats.totalVendors > 0 ? safeStats.totalVendors.toLocaleString() : '200+', labelEn: 'Verified Suppliers', labelAr: 'مورد موثق' },
              { icon: <Package className="h-4 w-4" />, value: safeStats.totalProducts > 0 ? safeStats.totalProducts.toLocaleString() : '5K+', labelEn: 'Active Products', labelAr: 'منتج نشط' },
              { icon: <HandshakeIcon className="h-4 w-4" />, value: safeStats.totalTransactions > 0 ? safeStats.totalTransactions.toLocaleString() : '1K+', labelEn: 'Deals Closed', labelAr: 'صفقة منجزة' },
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

      {/* ── Trust Bar ───────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-slate-100 py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {[
              { icon: <Shield className="h-4 w-4 text-emerald-600" />, textAr: 'موردون موثقو السجل التجاري', textEn: 'CR-Verified Suppliers' },
              { icon: <BarChart3 className="h-4 w-4 text-brand-600" />, textAr: 'ذكاء تسعير فوري', textEn: 'Real-time Price Intelligence' },
              { icon: <CheckCircle2 className="h-4 w-4" style={{ color: '#C9A349' }} />, textAr: 'مقارنة شفافة ودقيقة', textEn: 'Transparent Comparison' },
              { icon: <Award className="h-4 w-4 text-purple-600" />, textAr: 'مُقيَّم من المشترين الفعليين', textEn: 'Rated by Real Buyers' },
            ].map((item) => (
              <div key={item.textEn} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                {item.icon}
                <span>{ar ? item.textAr : item.textEn}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Mwazn / لماذا معيار؟ ────────────────────────────────────────── */}
      <section className="py-20 bg-surface" id="why">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold mb-3"
              style={{ background: 'rgba(201,163,73,0.12)', color: '#8B6420' }}
            >
              {ar ? 'لماذا معيار؟' : 'Why Mwazn?'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
              {ar ? 'ليست مجرد سوق — بل طبقة قرار' : 'Not Just a Marketplace — A Decision Layer'}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base">
              {ar
                ? 'معيار يمنحك أدوات الذكاء التي تحتاجها لاتخاذ قرارات شراء مبنية على البيانات.'
                : 'Mwazn gives you the intelligence tools you need to make data-driven purchasing decisions.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Layers className="h-6 w-6" />,
                titleAr: 'مقارنة ذكية',
                titleEn: 'Smart Comparison',
                descAr: 'قارن عروضاً متعددة جنباً إلى جنب بالسعر والتسليم والتقييم — اتخذ القرار الصحيح.',
                descEn: 'Compare multiple quotes side-by-side by price, delivery, and rating — pick the right one.',
                border: '#1B4F8A',
                iconBg: 'rgba(27,79,138,0.08)',
                iconColor: '#1B4F8A',
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                titleAr: 'مؤشرات سعرية',
                titleEn: 'Price Indicators',
                descAr: 'اعرف على الفور إذا كان السعر أقل أو أعلى من متوسط السوق — وفّر ميزانيتك.',
                descEn: 'Know instantly if a price is below or above market average — protect your budget.',
                border: '#C9A349',
                iconBg: 'rgba(201,163,73,0.10)',
                iconColor: '#C9A349',
              },
              {
                icon: <Shield className="h-6 w-6" />,
                titleAr: 'موردون موثقون',
                titleEn: 'Verified Suppliers',
                descAr: 'كل مورد موثق بالسجل التجاري السعودي ومُقيَّم من مشترين فعليين.',
                descEn: 'Every supplier is verified by Saudi Commercial Registration and rated by real buyers.',
                border: '#10B981',
                iconBg: 'rgba(16,185,129,0.08)',
                iconColor: '#10B981',
              },
              {
                icon: <Activity className="h-6 w-6" />,
                titleAr: 'رؤية كاملة',
                titleEn: 'Full Visibility',
                descAr: 'تابع كل صفقة من طلب العرض حتى التسليم — لا غموض في أي مرحلة.',
                descEn: 'Track every deal from RFQ to delivery — no ambiguity at any stage.',
                border: '#8B5CF6',
                iconBg: 'rgba(139,92,246,0.08)',
                iconColor: '#8B5CF6',
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

      {/* ── Comparison Preview ───────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 mb-3">
              {ar ? 'مقارنة الموردين' : 'Supplier Comparison'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
              {ar ? 'اتخذ قرارات شراء بمعلومات كاملة' : 'Purchase with Complete Information'}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {ar
                ? 'معيار يوضح لك على الفور إذا كان العرض أقل أو أعلى من متوسط السوق — لا حدس، بل بيانات.'
                : 'Mwazn instantly shows you if a quote is below or above market average — no guessing, just data.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-card">
            {/* Table header */}
            <div className="grid grid-cols-5 gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <div className="col-span-2">{ar ? 'المورد' : 'Supplier'}</div>
              <div className="text-center">{ar ? 'السعر / وحدة' : 'Unit Price'}</div>
              <div className="text-center">{ar ? 'التسليم' : 'Delivery'}</div>
              <div className="text-center">{ar ? 'مؤشر السوق' : 'Market Signal'}</div>
            </div>

            {MOCK_QUOTES.map((q, i) => (
              <div
                key={i}
                className={`grid grid-cols-5 gap-4 items-center px-6 py-4 transition-colors hover:bg-slate-50/70 ${i < MOCK_QUOTES.length - 1 ? 'border-b border-slate-100' : ''} ${q.tag === 'below' ? 'bg-emerald-50/40' : ''}`}
              >
                <div className="col-span-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
                    {(ar ? q.nameAr : q.nameEn).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{ar ? q.nameAr : q.nameEn}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <Shield className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs text-emerald-600">{ar ? 'موثق' : 'Verified'}</span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{q.rating} ★</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-base font-bold text-slate-800">{q.price}</span>
                  <span className="ms-1 text-xs text-slate-400">SAR</span>
                </div>
                <div className="text-center">
                  <span className="text-sm text-slate-600">
                    {ar ? `${q.delivery} أيام` : `${q.delivery} days`}
                  </span>
                </div>
                <div className="flex justify-center">
                  <PriceTag tag={q.tag} ar={ar} />
                </div>
              </div>
            ))}

            {/* Footer row */}
            <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <p className="text-sm text-slate-500">
                {ar
                  ? 'هذا مثال توضيحي — طلبك الحقيقي يجلب عروضاً من موردين موثقين.'
                  : 'Illustrative example — your real RFQ attracts quotes from verified suppliers.'}
              </p>
              <Link
                href={`/${locale}/auth/register?type=BUYER`}
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
              >
                {ar ? 'ابدأ الآن' : 'Get Started'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Top Products ──────────────────────────────────────────────────────── */}
      {safeProducts.length > 0 && (
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
                href={`/${locale}/suppliers`}
                className="hidden items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 sm:inline-flex"
              >
                {ar ? 'عرض الكل' : 'View All'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {safeProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/${locale}/suppliers/${product.supplier.slug ?? product.supplier.id}`}
                  className="card card-hover group overflow-hidden p-0"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-50">
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt={product.titleEn}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-12 w-12 text-slate-200" />
                      </div>
                    )}
                    <div className="absolute start-2 top-2">
                      <span className="rounded-lg bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-600 backdrop-blur">
                        {ar ? product.category.nameAr : product.category.nameEn}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="mb-1 line-clamp-2 text-sm font-semibold text-slate-800">
                      {ar ? product.titleAr : product.titleEn}
                    </p>
                    <p className="mb-3 truncate text-xs text-slate-400">
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
                        <span className="text-xs text-slate-400">
                          {product._count.quotes} {ar ? 'عرض' : 'quotes'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Top Rated Vendors ────────────────────────────────────────────────── */}
      {safeVendors.length > 0 && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="mb-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {ar ? 'أعلى الموردين تقييماً' : 'Top Rated Vendors'}
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
              {safeVendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/${locale}/suppliers/${vendor.slug ?? vendor.id}`}
                  className="card card-hover group flex flex-col overflow-hidden p-0"
                >
                  {/* Banner */}
                  <div className="relative h-16 flex-shrink-0 bg-gradient-to-br from-brand-900 to-brand-700">
                    {vendor.plan === 'PRO' && (
                      <span
                        className="absolute end-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ background: 'rgba(201,163,73,0.85)' }}
                      >
                        PRO
                      </span>
                    )}
                  </div>
                  {/* Logo + verified badge */}
                  <div className="-mt-6 mb-3 flex items-end justify-between px-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white text-lg font-bold text-brand-700 shadow-card">
                      {vendor.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={vendor.logoUrl} alt="" className="h-14 w-14 object-cover" />
                      ) : (
                        (ar ? vendor.nameAr : vendor.nameEn).charAt(0)
                      )}
                    </div>
                    <span className="mb-1 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      <Shield className="h-3 w-3" />
                      {ar ? 'موثق' : 'Verified'}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex flex-1 flex-col px-4 pb-4">
                    <h3 className="mb-0.5 line-clamp-2 text-sm font-semibold text-slate-800 transition-colors group-hover:text-brand-700">
                      {ar ? vendor.nameAr : vendor.nameEn}
                    </h3>
                    <p className="mb-3 text-xs text-slate-400">{vendor.city}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <StarRating score={vendor.averageRating} />
                        <span className="text-xs font-semibold text-slate-700">
                          {vendor.averageRating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {vendor._count.listings} {ar ? 'منتج' : 'products'}
                      </span>
                    </div>
                    {vendor.totalRatings > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        {vendor.totalRatings} {ar ? 'تقييم' : 'reviews'}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Showrooms ───────────────────────────────────────────────── */}
      {safeShowrooms.length > 0 && (
        <section className="py-20 bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="mb-2 inline-block rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                  {ar ? 'معارض المورّدين' : 'Featured Showrooms'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {ar ? 'تصفح معارض الموردين المميزين' : 'Browse Premium Supplier Showrooms'}
                </h2>
              </div>
              <Link
                href={`/${locale}/suppliers`}
                className="hidden items-center gap-1.5 text-sm font-semibold text-brand-700 sm:inline-flex"
              >
                {ar ? 'عرض الكل' : 'View All'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {safeShowrooms.map((showroom) => (
                <Link
                  key={showroom.id}
                  href={`/${locale}/suppliers/${showroom.slug ?? showroom.id}`}
                  className="card card-hover group overflow-hidden p-0"
                >
                  <div className="grid grid-cols-4 h-24 bg-slate-50">
                    {showroom.listings.slice(0, 4).map((listing, i) =>
                      listing.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={listing.id}
                          src={listing.images[0].url}
                          alt={listing.titleEn}
                          className={`h-24 w-full object-cover transition-opacity group-hover:opacity-90 ${i === 0 ? '' : 'border-s border-white'}`}
                        />
                      ) : (
                        <div key={listing.id} className="flex h-24 items-center justify-center border-s border-white bg-slate-100">
                          <Package className="h-5 w-5 text-slate-300" />
                        </div>
                      )
                    )}
                    {showroom.listings.length === 0 && (
                      <div className="col-span-4 flex h-24 items-center justify-center bg-slate-50">
                        <Building2 className="h-10 w-10 text-slate-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800 transition-colors group-hover:text-brand-700">
                          {ar ? showroom.nameAr : showroom.nameEn}
                        </h3>
                        <p className="text-xs text-slate-400">{showroom.city}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {showroom.plan === 'PRO' && <Badge variant="purple">PRO</Badge>}
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
                      <span className="flex items-center gap-1 font-semibold text-brand-700">
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

      {/* ── Latest Open RFQs ─────────────────────────────────────────────────── */}
      {safeRFQs.length > 0 && (
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
              {safeRFQs.map((rfq) => {
                const daysLeft = Math.max(0, Math.ceil((new Date(rfq.deadline).getTime() - Date.now()) / 86400_000));
                return (
                  <Link
                    key={rfq.id}
                    href={`/${locale}/auth/register?type=SUPPLIER`}
                    className="card card-hover group flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                        <FileText className="h-5 w-5 text-brand-700" />
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        daysLeft <= 3 ? 'bg-red-50 text-red-700' :
                        daysLeft <= 7 ? 'bg-amber-50 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {daysLeft === 0 ? (ar ? 'ينتهي اليوم' : 'Ends today') :
                         ar ? `${daysLeft} يوم متبقٍ` : `${daysLeft}d left`}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-brand-700 transition-colors mb-1">
                        {rfq.title}
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">
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

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      {!rfq.budgetUndisclosed && rfq.budget ? (
                        <span className="text-sm font-bold text-brand-700">
                          {Number(rfq.budget).toLocaleString()} {rfq.currency}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">{ar ? 'الميزانية غير محددة' : 'Budget undisclosed'}</span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {rfq._count.quotes} {ar ? 'عروض' : 'quotes'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <Link
                href={`/${locale}/auth/register?type=BUYER`}
                className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-50"
              >
                <FileText className="h-4 w-4" />
                {ar ? 'انشر طلب عرض سعر' : 'Post Your Own RFQ'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ──────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20"
        style={{ background: 'linear-gradient(135deg, #1E2D4D 0%, #1B4F8A 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="absolute end-0 top-0 h-80 w-80 rounded-full blur-3xl" style={{ background: 'rgba(201,163,73,0.08)' }} />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {ar ? 'مجاني للبدء — لا بطاقة ائتمان' : 'Free to start — no credit card required'}
          </div>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            {ar ? 'انضم إلى طبقة القرار' : 'Join the Decision Layer'}
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-white/70">
            {ar
              ? 'انضم إلى مئات الشركات السعودية التي تتخذ قرارات شرائها بذكاء على منصة معيار.'
              : 'Join hundreds of Saudi companies making smarter purchasing decisions on Mwazn.'}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href={`/${locale}/auth/register?type=BUYER`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-brand-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <ShoppingBag className="h-5 w-5" />
              {ar ? 'سجّل كمشترٍ مجاناً' : 'Register as Buyer — Free'}
            </Link>
            <Link
              href={`/${locale}/auth/register?type=SUPPLIER`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 font-semibold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              <Building2 className="h-5 w-5" />
              {ar ? 'انضم كمورّد' : 'Join as Supplier'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
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
                <li><Link href={`/${locale}#why`} className="hover:text-white transition-colors">{ar ? 'لماذا معيار' : 'Why Mwazn'}</Link></li>
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
    </div>
  );
}
