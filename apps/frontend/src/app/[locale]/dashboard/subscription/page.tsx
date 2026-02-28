'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { CheckCircle2, Zap, Star, MessageSquare, FileText, Infinity } from 'lucide-react';

function Toast({ msg }: { msg: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-800 text-white px-4 py-3 text-sm shadow-lift max-w-sm">
      {msg}
    </div>
  );
}

export default function SubscriptionPage() {
  const locale = useLocale();
  const { company } = useAuth();
  const ar = locale === 'ar';

  const isPro = company?.plan === 'PRO';
  const quotaUsed = company?.quotesUsedThisMonth ?? 0;
  const [upgrading, setUpgrading] = useState(false);
  const [toast, setToast] = useState('');

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await api.post('/payments/checkout', { plan: 'PRO' });
      const { checkoutUrl, isMock } = res.data.data || {};
      if (isMock) {
        setToast(ar
          ? 'بوابة الدفع قيد الإعداد — تواصل معنا عبر pro@mwazn.sa'
          : 'Payment gateway coming soon — contact us at pro@mwazn.sa');
        setTimeout(() => setToast(''), 5000);
      } else if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch {
      setToast(ar ? 'حدث خطأ، يرجى المحاولة لاحقاً' : 'Something went wrong, please try again');
      setTimeout(() => setToast(''), 4000);
    }
    setUpgrading(false);
  };

  const freeFeatures = ar
    ? ['10 عروض أسعار في الشهر', 'قائمة منتجات غير محدودة', 'مراسلة مع المشترين', 'لوحة تحكم أساسية']
    : ['10 quotes per month', 'Unlimited product listings', 'Buyer messaging', 'Basic dashboard'];

  const proFeatures = ar
    ? ['عروض أسعار غير محدودة', 'أولوية في نتائج البحث', 'شارة PRO المميزة', 'تحليلات متقدمة', 'دعم مخصص', 'كل مميزات الخطة المجانية']
    : ['Unlimited quotes', 'Priority in search results', 'PRO badge on profile', 'Advanced analytics', 'Dedicated support', 'All Free features'];

  return (
    <DashboardLayout>
      {toast && <Toast msg={toast} />}
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{ar ? 'الاشتراك' : 'Subscription'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {ar ? 'اختر الخطة المناسبة لنشاطك التجاري' : 'Choose the plan that fits your business'}
          </p>
        </div>

        {/* Current plan */}
        <div className={`rounded-2xl border-2 px-6 py-5 ${isPro ? 'border-gold-400 bg-gold-400/5' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{ar ? 'خطتك الحالية' : 'Current Plan'}</p>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {isPro ? 'PRO' : 'FREE'}
                {isPro && <span className="ms-2 text-xs font-normal text-gold-600">{ar ? 'نشط' : 'Active'}</span>}
              </p>
            </div>
            {!isPro && (
              <div className="text-end">
                <p className="text-sm font-semibold text-brand-700">
                  {ar ? `${quotaUsed}/10 عروض مستخدمة` : `${quotaUsed}/10 quotes used`}
                </p>
                <div className="mt-1.5 h-2 w-32 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-700 transition-all"
                    style={{ width: `${Math.min((quotaUsed / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {isPro && (
              <span className="flex items-center gap-1 text-gold-600 font-semibold">
                <Infinity className="h-5 w-5" />
                {ar ? 'غير محدود' : 'Unlimited'}
              </span>
            )}
          </div>
        </div>

        {/* Plans comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* FREE */}
          <div className={`card relative ${!isPro ? 'ring-2 ring-brand-700' : ''}`}>
            {!isPro && (
              <div className="absolute -top-3 start-4">
                <span className="rounded-full bg-brand-700 px-3 py-0.5 text-xs font-semibold text-white">
                  {ar ? 'خطتك الحالية' : 'Current Plan'}
                </span>
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-800 mb-1">FREE</h3>
            <p className="text-3xl font-bold text-slate-800 mb-1">
              {ar ? 'مجاناً' : 'Free'}
              <span className="text-sm font-normal text-slate-400 ms-1">/ {ar ? 'دائم' : 'forever'}</span>
            </p>
            <p className="text-sm text-slate-500 mb-6">
              {ar ? 'للموردين الجدد الذين يرغبون في التجربة' : 'For new suppliers exploring the platform'}
            </p>
            <ul className="space-y-3 mb-6">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {!isPro ? (
              <Button variant="secondary" className="w-full" disabled>
                {ar ? 'خطتك الحالية' : 'Current Plan'}
              </Button>
            ) : (
              <Button variant="ghost" className="w-full">
                {ar ? 'الرجوع للمجاني' : 'Downgrade'}
              </Button>
            )}
          </div>

          {/* PRO */}
          <div className={`card relative bg-gradient-to-b from-brand-50 to-white ${isPro ? 'ring-2 ring-gold-400' : ''}`}>
            {isPro && (
              <div className="absolute -top-3 start-4">
                <span className="rounded-full bg-gold-400 px-3 py-0.5 text-xs font-semibold text-brand-900">
                  {ar ? 'خطتك الحالية' : 'Current Plan'}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-800">PRO</h3>
              <Star className="h-4 w-4 text-gold-500 fill-gold-500" />
            </div>
            <p className="text-3xl font-bold text-brand-700 mb-1">
              {ar ? 'تواصل معنا' : 'Contact Us'}
              <span className="text-sm font-normal text-slate-400 ms-1">/ {ar ? 'للتسعير' : 'pricing'}</span>
            </p>
            <p className="text-sm text-slate-500 mb-6">
              {ar ? 'للموردين النشطين الذين يريدون نمواً أسرع' : 'For active suppliers who want faster growth'}
            </p>
            <ul className="space-y-3 mb-6">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <Zap className="h-4 w-4 text-brand-700 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {!isPro ? (
              <Button
                className="w-full"
                icon={<Zap className="h-4 w-4" />}
                onClick={handleUpgrade}
                loading={upgrading}
              >
                {ar ? 'الترقية لـ PRO' : 'Upgrade to PRO'}
              </Button>
            ) : (
              <Button className="w-full" disabled icon={<Star className="h-4 w-4" />}>
                {ar ? 'أنت على PRO 🎉' : 'You\'re on PRO 🎉'}
              </Button>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">{ar ? 'أسئلة شائعة' : 'FAQ'}</h3>
          <div className="space-y-4">
            {[
              {
                q: ar ? 'كيف تُحسب عروض الأسعار على الخطة المجانية؟' : 'How are quotes counted on the Free plan?',
                a: ar ? 'كل عرض مقدّم على طلب يُحتسب ضمن الحصة. تتجدد الحصة في بداية كل شهر ميلادي.' : 'Each submitted quote on an RFQ counts toward your quota. Quota resets at the start of each calendar month.',
              },
              {
                q: ar ? 'هل يمكنني إضافة منتجات بالخطة المجانية؟' : 'Can I add listings on the Free plan?',
                a: ar ? 'نعم، إضافة المنتجات غير محدودة في كلا الخطتين. القيود تنطبق على عروض الأسعار فقط.' : 'Yes, listings are unlimited on both plans. Limits apply only to quote submissions.',
              },
              {
                q: ar ? 'كيف أُرقّي لخطة PRO؟' : 'How do I upgrade to PRO?',
                a: ar ? 'تواصل مع فريق موازن عبر البريد الإلكتروني pro@mwazn.sa وسيتم ترقية حسابك خلال 24 ساعة.' : 'Contact the Mwazn team at pro@mwazn.sa and your account will be upgraded within 24 hours.',
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <p className="font-medium text-slate-800 text-sm mb-1.5">{item.q}</p>
                <p className="text-sm text-slate-500">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
