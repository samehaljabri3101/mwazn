import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import {
  ArrowRight, CheckCircle2, FileText, BarChart3, MessageSquare,
  Star, Shield, TrendingUp, Building2, Package, ChevronRight,
} from 'lucide-react';

export default async function LandingPage() {
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 pt-20 pb-32">
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 mb-6 backdrop-blur">
            <Shield className="h-3.5 w-3.5" />
            {locale === 'ar' ? 'موردون موثقون بالسجل التجاري' : 'CR-verified suppliers only'}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            {locale === 'ar' ? (
              <>منصة <span className="text-gold-400">B2B</span> الرائدة<br />في المملكة العربية السعودية</>
            ) : (
              <>Saudi Arabia's Premier<br /><span className="text-gold-400">B2B Marketplace</span></>
            )}
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-white/70 mb-10">
            {locale === 'ar'
              ? 'تواصل مع موردين موثقين، اطلب عروض الأسعار، وأتمم صفقاتك — كل ذلك في منصة واحدة.'
              : 'Connect with verified suppliers, request quotations, and close deals — all in one platform.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/auth/register?type=BUYER`}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-lift hover:bg-slate-50 transition-all"
            >
              {locale === 'ar' ? 'سجّل كمشترٍ' : 'Register as Buyer'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/auth/register?type=SUPPLIER`}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all backdrop-blur"
            >
              {locale === 'ar' ? 'انضم كمورّد' : 'Join as Supplier'}
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: '40+', label: locale === 'ar' ? 'شركة' : 'Companies' },
              { value: '25+', label: locale === 'ar' ? 'فئة' : 'Categories' },
              { value: '30+', label: locale === 'ar' ? 'طلب عرض' : 'Active RFQs' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/60 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 64L1440 64L1440 0C1200 50 240 50 0 0L0 64Z" fill="#F8FAFC" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-surface" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
              {locale === 'ar' ? 'كل ما تحتاجه لإدارة المشتريات' : 'Everything you need for B2B procurement'}
            </h2>
            <p className="text-slate-500">
              {locale === 'ar' ? 'منصة متكاملة تجمع الموردين والمشترين في مكان واحد.' : 'One platform connecting buyers and suppliers.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <FileText className="h-6 w-6" />, titleEn: 'RFQ Management', titleAr: 'إدارة طلبات الأسعار', descEn: 'Create and manage RFQs with ease. Receive competitive quotes from verified suppliers.', descAr: 'أنشئ وأدر طلبات الأسعار بسهولة. استقبل عروضاً تنافسية.' },
              { icon: <BarChart3 className="h-6 w-6" />, titleEn: 'Compare Quotes', titleAr: 'مقارنة العروض', descEn: 'Compare quotes side by side and make data-driven purchasing decisions.', descAr: 'قارن العروض جنباً إلى جنب واتخذ قرارات شراء مدروسة.' },
              { icon: <Shield className="h-6 w-6" />, titleEn: 'Verified Suppliers', titleAr: 'موردون موثقون', descEn: 'Every supplier is manually verified against their Commercial Registration number.', descAr: 'كل مورد يتم التحقق منه يدوياً بموجب سجله التجاري.' },
              { icon: <MessageSquare className="h-6 w-6" />, titleEn: 'Built-in Messaging', titleAr: 'مراسلة داخلية', descEn: 'Communicate directly with suppliers inside the platform. No email chains.', descAr: 'تواصل مع الموردين داخل المنصة. لا مزيد من سلاسل البريد.' },
              { icon: <TrendingUp className="h-6 w-6" />, titleEn: 'Deal Tracking', titleAr: 'تتبع الصفقات', descEn: 'Track every deal from award to completion with clear lifecycle stages.', descAr: 'تابع كل صفقة من الترسية حتى الإتمام.' },
              { icon: <Star className="h-6 w-6" />, titleEn: 'Ratings & Reviews', titleAr: 'التقييمات', descEn: 'Rate suppliers post-deal to build a trust-driven marketplace ecosystem.', descAr: 'قيّم الموردين بعد الصفقة لبناء سوق قائم على الثقة.' },
            ].map((feat) => (
              <div key={feat.titleEn} className="card card-hover group">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white transition-all">
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">
                  {locale === 'ar' ? feat.titleAr : feat.titleEn}
                </h3>
                <p className="text-sm text-slate-500">
                  {locale === 'ar' ? feat.descAr : feat.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
              {locale === 'ar' ? 'كيف تعمل موازن؟' : 'How Mwazn Works'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '01', titleEn: 'Post an RFQ', titleAr: 'انشر طلب عرض', descEn: 'Describe your needs, set a budget and deadline.', descAr: 'صف ما تحتاجه وحدد ميزانيتك.' },
              { n: '02', titleEn: 'Receive Quotes', titleAr: 'استقبل العروض', descEn: 'Verified suppliers submit competitive offers within hours.', descAr: 'يتقدم الموردون الموثقون بأفضل عروضهم.' },
              { n: '03', titleEn: 'Award & Track', titleAr: 'رسّ وتابع', descEn: 'Accept the best offer, track the deal, and rate the supplier.', descAr: 'اقبل أفضل عرض وتابع صفقتك حتى الإتمام.' },
            ].map((step) => (
              <div key={step.n} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-white font-bold text-xl">
                  {step.n}
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">
                  {locale === 'ar' ? step.titleAr : step.titleEn}
                </h3>
                <p className="text-sm text-slate-500">
                  {locale === 'ar' ? step.descAr : step.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-700">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {locale === 'ar' ? 'جاهز للبدء؟' : 'Ready to get started?'}
          </h2>
          <p className="text-white/70 mb-8">
            {locale === 'ar' ? 'انضم إلى مئات الشركات التي تستخدم موازن.' : 'Join hundreds of companies already using Mwazn.'}
          </p>
          <Link
            href={`/${locale}/auth/register`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-brand-700 hover:bg-slate-50 transition-all"
          >
            {locale === 'ar' ? 'إنشاء حساب مجاني' : 'Create Free Account'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 bg-white">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-700">
              <span className="text-xs font-bold text-white">م</span>
            </div>
            <span className="font-semibold text-brand-700">{locale === 'ar' ? 'موازن' : 'Mwazn'}</span>
          </div>
          <p className="text-sm text-slate-400">
            © 2026 Mwazn. {locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
