import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';

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
import { MapPin, Star, Package, Search } from 'lucide-react';

// Realistic Saudi supplier data for SSR demo
const DEMO_SUPPLIERS = [
  {
    id: 'demo-1',
    nameAr: 'شركة الخليج للمعدات الصناعية',
    nameEn: 'Gulf Industrial Equipment Co.',
    city: 'Riyadh',
    categories: ['Industrial Equipment', 'Safety'],
    categoriesAr: ['معدات صناعية', 'سلامة'],
    rating: 4.8,
    reviews: 24,
    listingsCount: 38,
    plan: 'PRO',
    logo: null,
  },
  {
    id: 'demo-2',
    nameAr: 'مؤسسة العمران للمواد الإنشائية',
    nameEn: 'Al-Omran Construction Materials',
    city: 'Jeddah',
    categories: ['Building Materials', 'Construction'],
    categoriesAr: ['مواد بناء', 'إنشاءات'],
    rating: 4.6,
    reviews: 18,
    listingsCount: 24,
    plan: 'PRO',
    logo: null,
  },
  {
    id: 'demo-3',
    nameAr: 'الشركة الوطنية للأثاث المكتبي',
    nameEn: 'National Office Furniture Company',
    city: 'Riyadh',
    categories: ['Furniture', 'Office Equipment'],
    categoriesAr: ['أثاث', 'تجهيزات مكتبية'],
    rating: 4.5,
    reviews: 31,
    listingsCount: 52,
    plan: 'FREE',
    logo: null,
  },
  {
    id: 'demo-4',
    nameAr: 'تقنية المستقبل للحلول الرقمية',
    nameEn: 'Future Tech Digital Solutions',
    city: 'Dammam',
    categories: ['Technology', 'IT Services'],
    categoriesAr: ['تقنية', 'خدمات IT'],
    rating: 4.9,
    reviews: 15,
    listingsCount: 19,
    plan: 'PRO',
    logo: null,
  },
  {
    id: 'demo-5',
    nameAr: 'شركة الأصيل للأغذية والمشروبات',
    nameEn: 'Al-Aseel Food & Beverages',
    city: 'Riyadh',
    categories: ['Food & Beverages', 'Restaurant Equipment'],
    categoriesAr: ['أغذية', 'معدات مطاعم'],
    rating: 4.3,
    reviews: 42,
    listingsCount: 67,
    plan: 'PRO',
    logo: null,
  },
  {
    id: 'demo-6',
    nameAr: 'مجموعة النهضة للكيماويات',
    nameEn: 'Al-Nahda Chemical Group',
    city: 'Jubail',
    categories: ['Chemicals', 'Laboratory Equipment'],
    categoriesAr: ['كيماويات', 'معدات مختبرات'],
    rating: 4.7,
    reviews: 9,
    listingsCount: 31,
    plan: 'PRO',
    logo: null,
  },
  {
    id: 'demo-7',
    nameAr: 'الفهد للمعدات الكهربائية',
    nameEn: 'Al-Fahd Electrical Equipment',
    city: 'Riyadh',
    categories: ['Electrical', 'HVAC'],
    categoriesAr: ['كهربائيات', 'تكييف'],
    rating: 4.4,
    reviews: 27,
    listingsCount: 44,
    plan: 'FREE',
    logo: null,
  },
  {
    id: 'demo-8',
    nameAr: 'شركة السلامة للطب والرعاية',
    nameEn: 'Al-Salama Medical & Care',
    city: 'Khobar',
    categories: ['Medical Equipment', 'Safety'],
    categoriesAr: ['أجهزة طبية', 'سلامة'],
    rating: 4.6,
    reviews: 13,
    listingsCount: 22,
    plan: 'PRO',
    logo: null,
  },
];

const SAUDI_CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Jubail', 'Madinah'];

export default async function SuppliersPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';

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
              ? 'اكتشف أكثر من 25 مورداً موثقاً بالسجل التجاري في مختلف القطاعات'
              : 'Discover 25+ CR-verified suppliers across all major industries'}
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder={ar ? 'ابحث عن مورد...' : 'Search suppliers...'}
                className="input-base ps-9 bg-white"
                readOnly
              />
            </div>
            <select className="input-base sm:w-44 bg-white">
              <option>{ar ? 'جميع المدن' : 'All Cities'}</option>
              {SAUDI_CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Supplier grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {DEMO_SUPPLIERS.map((sup) => (
              <Link
                key={sup.id}
                href={`/${locale}/suppliers/${sup.id}`}
                className="card card-hover group flex flex-col gap-4"
              >
                {/* Logo */}
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 font-bold text-2xl mx-auto">
                  {(ar ? sup.nameAr : sup.nameEn).charAt(0)}
                </div>

                {/* Name + PRO badge */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <p className="font-semibold text-slate-800 group-hover:text-brand-700 transition-colors leading-tight">
                      {ar ? sup.nameAr : sup.nameEn}
                    </p>
                    {sup.plan === 'PRO' && (
                      <span className="inline-flex items-center rounded-full bg-gold-400/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-600">PRO</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {sup.city}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-gold-500 fill-gold-500" />
                    {sup.rating} <span className="text-slate-400">({sup.reviews})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    {ar ? `${sup.listingsCount} منتج` : `${sup.listingsCount} products`}
                  </span>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {(ar ? sup.categoriesAr : sup.categories).slice(0, 2).map((cat) => (
                    <span key={cat} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-2 border-t border-slate-100 text-center">
                  <span className="text-xs font-medium text-brand-700 group-hover:underline">
                    {ar ? 'عرض الصفحة' : 'View Showroom'}
                  </span>
                </div>
              </Link>
            ))}
          </div>

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
