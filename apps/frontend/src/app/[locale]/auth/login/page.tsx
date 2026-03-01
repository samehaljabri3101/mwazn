'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, Shield } from 'lucide-react';

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ar = locale === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const redirect = searchParams?.get('redirect');
      router.push(redirect || `/${locale}/dashboard`);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        (ar ? 'بريد إلكتروني أو كلمة مرور غير صحيحة.' : 'Invalid email or password.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/assets/grid.svg')]" />
        <div className="relative text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <span className="text-3xl font-bold text-white">م</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            {ar ? 'موازن' : 'Mwazn'}
          </h1>
          <p className="text-white/60 text-lg mb-10">
            {ar ? 'منصة B2B الرائدة في السعودية' : "Saudi Arabia's Premier B2B Marketplace"}
          </p>
          <div className="space-y-4 text-start">
            {[
              { en: 'Verified supplier network', ar: 'شبكة موردين موثّقين' },
              { en: 'Streamlined RFQ process', ar: 'إدارة طلبات الأسعار بكفاءة' },
              { en: 'Deal tracking & rating', ar: 'تتبع الصفقات والتقييمات' },
            ].map((item) => (
              <div key={item.en} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400">
                  <svg className="h-3.5 w-3.5 text-brand-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80 text-sm">{ar ? item.ar : item.en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-700">
            <span className="text-sm font-bold text-white">م</span>
          </div>
          <span className="text-xl font-bold text-brand-700">{ar ? 'موازن' : 'Mwazn'}</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              {ar ? 'تسجيل الدخول' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 mt-1">
              {ar ? 'أدخل بياناتك للمتابعة' : 'Sign in to your Mwazn account'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-base">
                {ar ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={ar ? 'example@company.sa' : 'you@company.sa'}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-base mb-0">
                  {ar ? 'كلمة المرور' : 'Password'}
                </label>
                <button type="button" className="text-xs text-brand-600 hover:text-brand-700">
                  {ar ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {ar ? 'تسجيل الدخول' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {ar ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
            <Link href={`/${locale}/auth/register`} className="text-brand-700 font-medium hover:underline">
              {ar ? 'إنشاء حساب' : 'Create one'}
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 rounded-xl bg-brand-50 border border-brand-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-brand-700" />
              <p className="text-xs font-semibold text-brand-700">
                {ar ? 'بيانات تجريبية' : 'Demo Accounts'}
              </p>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <p><span className="font-medium">{ar ? 'مشترٍ:' : 'Buyer:'}</span> admin@buyer1.sa / Buyer@1234</p>
              <p><span className="font-medium">{ar ? 'مورّد:' : 'Supplier:'}</span> admin@supplier1.sa / Supplier@1234</p>
              <p><span className="font-medium">{ar ? 'إداري:' : 'Admin:'}</span> admin@mwazn.sa / Admin@1234</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
