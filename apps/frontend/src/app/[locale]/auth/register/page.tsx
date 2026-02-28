'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2, User, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

type CompanyType = 'BUYER' | 'SUPPLIER';

interface FormData {
  nameAr: string;
  nameEn: string;
  crNumber: string;
  type: CompanyType;
  city: string;
  phone: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SAUDI_CITIES = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام',
  'الخبر', 'الظهران', 'تبوك', 'أبها', 'نجران',
];

const SAUDI_CITIES_EN = [
  'Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam',
  'Khobar', 'Dhahran', 'Tabuk', 'Abha', 'Najran',
];

export default function RegisterPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const ar = locale === 'ar';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    nameAr: '',
    nameEn: '',
    crNumber: '',
    type: (searchParams.get('type') as CompanyType) || 'BUYER',
    city: '',
    phone: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const set = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canNext = () => {
    if (step === 1) return form.nameAr && form.nameEn && form.crNumber.length >= 10 && form.city;
    if (step === 2) return form.fullName && form.email && form.password.length >= 8 && form.password === form.confirmPassword;
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        crNumber: form.crNumber,
        type: form.type,
        city: form.city,
        phone: form.phone,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      // Auto-login after registration
      await login(form.email, form.password);
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || (ar ? 'حدث خطأ. حاول مجدداً.' : 'Registration failed. Please try again.'));
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: ar ? 'بيانات الشركة' : 'Company Info', icon: <Building2 className="h-4 w-4" /> },
    { label: ar ? 'بيانات الحساب' : 'Account Details', icon: <User className="h-4 w-4" /> },
    { label: ar ? 'مراجعة وإرسال' : 'Review & Submit', icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700">
          <span className="text-lg font-bold text-white">م</span>
        </div>
        <span className="text-xl font-bold text-brand-700">{ar ? 'موازن' : 'Mwazn'}</span>
      </div>

      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  done ? 'bg-green-500 text-white' : active ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  {done ? '✓' : n}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${active ? 'text-brand-700' : 'text-slate-400'}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`h-px w-8 sm:w-16 ${done ? 'bg-green-300' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            {steps[step - 1].label}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {ar ? `الخطوة ${step} من ${steps.length}` : `Step ${step} of ${steps.length}`}
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Step 1: Company Info */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Company type toggle */}
              <div>
                <label className="label-base">{ar ? 'نوع الحساب' : 'Account Type'}</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['BUYER', 'SUPPLIER'] as CompanyType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => set('type', type)}
                      className={`rounded-xl border-2 p-3 text-start transition-all ${
                        form.type === type
                          ? 'border-brand-700 bg-brand-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-sm text-slate-800">
                        {type === 'BUYER' ? (ar ? 'مشترٍ' : 'Buyer') : (ar ? 'مورّد' : 'Supplier')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {type === 'BUYER'
                          ? (ar ? 'أبحث عن موردين وأطلب الأسعار' : 'I want to source and buy')
                          : (ar ? 'أبيع منتجات وأقدم عروض أسعار' : 'I want to sell and quote')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">{ar ? 'اسم الشركة (عربي)' : 'Company Name (AR)'}</label>
                  <Input value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} placeholder="مثال: شركة الأمل" dir="rtl" />
                </div>
                <div>
                  <label className="label-base">{ar ? 'اسم الشركة (إنجليزي)' : 'Company Name (EN)'}</label>
                  <Input value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} placeholder="e.g. Al Amal Co." />
                </div>
              </div>

              <div>
                <label className="label-base">{ar ? 'رقم السجل التجاري' : 'Commercial Registration No.'}</label>
                <Input
                  value={form.crNumber}
                  onChange={(e) => set('crNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10 digits"
                  maxLength={10}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {ar ? '10 أرقام' : '10-digit CR number'}
                </p>
              </div>

              <div>
                <label className="label-base">{ar ? 'المدينة' : 'City'}</label>
                <select
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  className="input-base"
                >
                  <option value="">{ar ? 'اختر المدينة' : 'Select city'}</option>
                  {(ar ? SAUDI_CITIES : SAUDI_CITIES_EN).map((city, i) => (
                    <option key={city} value={SAUDI_CITIES_EN[i]}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-base">{ar ? 'رقم الجوال' : 'Phone Number'}</label>
                <Input
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+966 5X XXX XXXX"
                  type="tel"
                />
              </div>
            </div>
          )}

          {/* Step 2: Account Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="label-base">{ar ? 'الاسم الكامل' : 'Full Name'}</label>
                <Input
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  placeholder={ar ? 'محمد العمري' : 'Mohammed Al-Omari'}
                />
              </div>
              <div>
                <label className="label-base">{ar ? 'البريد الإلكتروني' : 'Email Address'}</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="admin@company.sa"
                />
              </div>
              <div>
                <label className="label-base">{ar ? 'كلمة المرور' : 'Password'}</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="••••••••"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {ar ? '8 أحرف على الأقل' : 'At least 8 characters'}
                </p>
              </div>
              <div>
                <label className="label-base">{ar ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {ar ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {ar ? 'بيانات الشركة' : 'Company Information'}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">{ar ? 'الاسم (عربي)' : 'Name (AR)'}</p>
                    <p className="font-medium text-slate-800">{form.nameAr}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">{ar ? 'الاسم (إنجليزي)' : 'Name (EN)'}</p>
                    <p className="font-medium text-slate-800">{form.nameEn}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">{ar ? 'السجل التجاري' : 'CR Number'}</p>
                    <p className="font-medium text-slate-800">{form.crNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">{ar ? 'النوع' : 'Type'}</p>
                    <p className="font-medium text-slate-800">
                      {form.type === 'BUYER' ? (ar ? 'مشترٍ' : 'Buyer') : (ar ? 'مورّد' : 'Supplier')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">{ar ? 'المدينة' : 'City'}</p>
                    <p className="font-medium text-slate-800">{form.city}</p>
                  </div>
                  {form.phone && (
                    <div>
                      <p className="text-slate-400 text-xs">{ar ? 'الجوال' : 'Phone'}</p>
                      <p className="font-medium text-slate-800">{form.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {ar ? 'بيانات الحساب' : 'Account Details'}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">{ar ? 'الاسم' : 'Name'}</p>
                    <p className="font-medium text-slate-800">{form.fullName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">{ar ? 'البريد الإلكتروني' : 'Email'}</p>
                    <p className="font-medium text-slate-800">{form.email}</p>
                  </div>
                </div>
              </div>

              {form.type === 'SUPPLIER' && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
                  <p className="font-medium mb-0.5">{ar ? 'ملاحظة التحقق' : 'Verification Note'}</p>
                  <p className="text-xs text-amber-600">
                    {ar
                      ? 'سيتم مراجعة ملفك من فريق موازن قبل تفعيل حساب المورد. ستتلقى إشعاراً بالبريد عند الموافقة.'
                      : 'Your supplier account will be reviewed by the Mwazn team before activation. You will be notified by email.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            <div>
              {step > 1 && (
                <Button variant="secondary" onClick={() => setStep(step - 1)} icon={<ChevronLeft className="h-4 w-4" />}>
                  {ar ? 'السابق' : 'Back'}
                </Button>
              )}
            </div>
            <div>
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canNext()}
                  icon={<ChevronRight className="h-4 w-4" />}
                  iconPosition="right"
                >
                  {ar ? 'التالي' : 'Next'}
                </Button>
              ) : (
                <Button onClick={handleSubmit} loading={loading} icon={<CheckCircle2 className="h-4 w-4" />}>
                  {ar ? 'إنشاء الحساب' : 'Create Account'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          {ar ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
          <Link href={`/${locale}/auth/login`} className="text-brand-700 font-medium hover:underline">
            {ar ? 'تسجيل الدخول' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}
