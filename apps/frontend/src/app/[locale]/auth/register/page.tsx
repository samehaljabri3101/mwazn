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

const LEGAL_FORMS = [
  { value: 'LLC', ar: 'شركة ذات مسؤولية محدودة', en: 'LLC' },
  { value: 'ESTABLISHMENT', ar: 'مؤسسة فردية', en: 'Establishment' },
  { value: 'CORPORATION', ar: 'شركة مساهمة', en: 'Corporation' },
  { value: 'PARTNERSHIP', ar: 'شركة تضامنية', en: 'Partnership' },
  { value: 'JOINT_STOCK', ar: 'شركة مساهمة مقفلة', en: 'Joint Stock' },
];

const SIZE_RANGES = ['1-10', '11-50', '51-200', '201-500', '500+'];

const SAUDI_CITIES_AR = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران', 'تبوك', 'أبها', 'نجران'];
const SAUDI_CITIES_EN = ['Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Khobar', 'Dhahran', 'Tabuk', 'Abha', 'Najran'];

const SECTORS_AR = ['مواد البناء', 'الأثاث والديكور', 'المعدات الصناعية', 'التقنية والإلكترونيات', 'الغذاء والمشروبات', 'اللوجستيك', 'الكيماويات', 'الأجهزة الطبية', 'الطاقة', 'الملابس', 'السلامة والأمن'];
const SECTORS_EN = ['Building Materials', 'Furniture & Decor', 'Industrial Equipment', 'Technology & Electronics', 'Food & Beverages', 'Logistics', 'Chemicals', 'Medical Devices', 'Energy', 'Clothing', 'Safety & Security'];
const SECTOR_VALUES = ['building-materials', 'furniture-decor', 'industrial-equipment', 'technology-electronics', 'food-beverages', 'logistics-transport', 'chemicals-raw-materials', 'medical-devices', 'energy-petroleum', 'clothing-textiles', 'safety-security'];

interface FormData {
  nameAr: string; nameEn: string; crNumber: string; type: CompanyType;
  crExpiryDate: string; vatNumber: string; legalForm: string;
  establishmentYear: string; companySizeRange: string; sectors: string[];
  city: string; phone: string;
  fullName: string; contactJobTitle: string; email: string;
  password: string; confirmPassword: string;
}

export default function RegisterPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, company, isLoading } = useAuth();
  const ar = locale === 'ar';

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(company?.type === 'SUPPLIER'
        ? `/${locale}/dashboard/supplier`
        : `/${locale}/dashboard/buyer`);
    }
  }, [isLoading, user, company, locale, router]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    nameAr: '', nameEn: '', crNumber: '',
    type: (searchParams.get('type') as CompanyType) || 'BUYER',
    crExpiryDate: '', vatNumber: '', legalForm: '',
    establishmentYear: '', companySizeRange: '', sectors: [],
    city: '', phone: '',
    fullName: '', contactJobTitle: '', email: '',
    password: '', confirmPassword: '',
  });

  const set = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSector = (val: string) => {
    setForm((prev) => ({
      ...prev,
      sectors: prev.sectors.includes(val)
        ? prev.sectors.filter((s) => s !== val)
        : [...prev.sectors, val],
    }));
  };

  const canNext = () => {
    if (step === 1) return form.nameAr && form.nameEn && /^\d{10}$/.test(form.crNumber) && form.city;
    if (step === 2) return form.fullName && form.email && form.password.length >= 8 && form.password === form.confirmPassword;
    return true;
  };

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      await api.post('/auth/register', {
        companyNameAr: form.nameAr, companyNameEn: form.nameEn,
        crNumber: form.crNumber, companyType: form.type,
        crExpiryDate: form.crExpiryDate || undefined,
        vatNumber: form.vatNumber || undefined,
        legalForm: form.legalForm || undefined,
        establishmentYear: form.establishmentYear ? Number(form.establishmentYear) : undefined,
        companySizeRange: form.companySizeRange || undefined,
        sectors: form.sectors.length > 0 ? form.sectors : undefined,
        city: form.city, phone: form.phone || undefined,
        fullName: form.fullName, contactJobTitle: form.contactJobTitle || undefined,
        email: form.email, password: form.password,
      });
      await login(form.email, form.password);
      router.push(form.type === 'BUYER' ? `/${locale}/dashboard/buyer` : `/${locale}/dashboard/supplier`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || (ar ? 'حدث خطأ. حاول مجدداً.' : 'Registration failed. Please try again.'));
      setStep(1);
    } finally { setLoading(false); }
  };

  const steps = [
    { label: ar ? 'بيانات الشركة' : 'Company Info', icon: <Building2 className="h-4 w-4" /> },
    { label: ar ? 'بيانات الحساب' : 'Account Details', icon: <User className="h-4 w-4" /> },
    { label: ar ? 'مراجعة وإرسال' : 'Review & Submit', icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700">
          <span className="text-lg font-bold text-white">م</span>
        </div>
        <span className="text-xl font-bold text-brand-700">{ar ? 'موازن' : 'Mwazn'}</span>
      </div>

      <div className="w-full max-w-2xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => {
            const n = i + 1; const done = step > n; const active = step === n;
            return (
              <div key={n} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {done ? '✓' : n}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${active ? 'text-brand-700' : 'text-slate-400'}`}>{s.label}</span>
                {i < steps.length - 1 && <div className={`h-px w-8 sm:w-16 ${done ? 'bg-green-300' : 'bg-slate-200'}`} />}
              </div>
            );
          })}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-slate-800 mb-1">{steps[step - 1].label}</h2>
          <p className="text-sm text-slate-500 mb-6">{ar ? `الخطوة ${step} من ${steps.length}` : `Step ${step} of ${steps.length}`}</p>

          {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}

          {/* ── Step 1: Company Info ───────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Account type */}
              <div>
                <label className="label-base">{ar ? 'نوع الحساب' : 'Account Type'}</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['BUYER', 'SUPPLIER'] as CompanyType[]).map((type) => (
                    <button key={type} type="button" onClick={() => set('type', type)}
                      className={`rounded-xl border-2 p-3 text-start transition-all ${form.type === type ? 'border-brand-700 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="font-semibold text-sm text-slate-800">
                        {type === 'BUYER' ? (ar ? 'مشترٍ' : 'Buyer') : (ar ? 'مورّد' : 'Supplier')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {type === 'BUYER' ? (ar ? 'أبحث عن موردين وأطلب الأسعار' : 'I want to source and buy') : (ar ? 'أبيع منتجات وأقدم عروض أسعار' : 'I want to sell and quote')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Company names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">{ar ? 'اسم الشركة (عربي) *' : 'Company Name (AR) *'}</label>
                  <Input value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} placeholder="مثال: شركة الأمل" dir="rtl" />
                </div>
                <div>
                  <label className="label-base">{ar ? 'اسم الشركة (إنجليزي) *' : 'Company Name (EN) *'}</label>
                  <Input value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} placeholder="e.g. Al Amal Co." />
                </div>
              </div>

              {/* CR + VAT */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">{ar ? 'رقم السجل التجاري *' : 'CR Number *'}</label>
                  <Input value={form.crNumber} onChange={(e) => set('crNumber', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10 digits" maxLength={10} />
                  <p className="text-xs text-slate-400 mt-1">{ar ? '10 أرقام' : '10-digit CR number'}</p>
                </div>
                <div>
                  <label className="label-base">{ar ? 'تاريخ انتهاء السجل' : 'CR Expiry Date'}</label>
                  <Input type="date" value={form.crExpiryDate} onChange={(e) => set('crExpiryDate', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">{ar ? 'الرقم الضريبي (VAT)' : 'VAT Number'}</label>
                  <Input value={form.vatNumber} onChange={(e) => set('vatNumber', e.target.value.replace(/\D/g, '').slice(0, 15))} placeholder="310000000000003" maxLength={15} />
                  <p className="text-xs text-slate-400 mt-1">{ar ? '15 رقماً' : '15 digits'}</p>
                </div>
                <div>
                  <label className="label-base">{ar ? 'الشكل القانوني' : 'Legal Form'}</label>
                  <select value={form.legalForm} onChange={(e) => set('legalForm', e.target.value)} className="input-base">
                    <option value="">{ar ? 'اختر' : 'Select'}</option>
                    {LEGAL_FORMS.map((lf) => <option key={lf.value} value={lf.value}>{ar ? lf.ar : lf.en}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">{ar ? 'سنة التأسيس' : 'Establishment Year'}</label>
                  <Input type="number" min="1900" max={new Date().getFullYear()} value={form.establishmentYear} onChange={(e) => set('establishmentYear', e.target.value)} placeholder="2010" />
                </div>
                <div>
                  <label className="label-base">{ar ? 'حجم الشركة' : 'Company Size'}</label>
                  <select value={form.companySizeRange} onChange={(e) => set('companySizeRange', e.target.value)} className="input-base">
                    <option value="">{ar ? 'عدد الموظفين' : 'No. of employees'}</option>
                    {SIZE_RANGES.map((s) => <option key={s} value={s}>{s} {ar ? 'موظف' : 'employees'}</option>)}
                  </select>
                </div>
              </div>

              {/* Sectors */}
              <div>
                <label className="label-base">{ar ? 'القطاعات (اختر ما ينطبق)' : 'Sectors (select all that apply)'}</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SECTOR_VALUES.map((val, i) => (
                    <button key={val} type="button" onClick={() => toggleSector(val)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${form.sectors.includes(val) ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'}`}>
                      {ar ? SECTORS_AR[i] : SECTORS_EN[i]}
                    </button>
                  ))}
                </div>
              </div>

              {/* City + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">{ar ? 'المدينة *' : 'City *'}</label>
                  <select value={form.city} onChange={(e) => set('city', e.target.value)} className="input-base">
                    <option value="">{ar ? 'اختر المدينة' : 'Select city'}</option>
                    {(ar ? SAUDI_CITIES_AR : SAUDI_CITIES_EN).map((city, i) => (
                      <option key={city} value={SAUDI_CITIES_EN[i]}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base">{ar ? 'رقم الجوال' : 'Phone Number'}</label>
                  <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+966 5X XXX XXXX" type="tel" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Account Details ────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">{ar ? 'الاسم الكامل *' : 'Full Name *'}</label>
                  <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder={ar ? 'محمد العمري' : 'Mohammed Al-Omari'} />
                </div>
                <div>
                  <label className="label-base">{ar ? 'المسمى الوظيفي' : 'Job Title'}</label>
                  <Input value={form.contactJobTitle} onChange={(e) => set('contactJobTitle', e.target.value)} placeholder={ar ? 'مثال: مدير المشتريات' : 'e.g. Procurement Manager'} />
                </div>
              </div>
              <div>
                <label className="label-base">{ar ? 'البريد الإلكتروني *' : 'Email Address *'}</label>
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="admin@company.sa" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">{ar ? 'كلمة المرور *' : 'Password *'}</label>
                  <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" />
                  <p className="text-xs text-slate-400 mt-1">{ar ? '8 أحرف على الأقل' : 'At least 8 characters'}</p>
                </div>
                <div>
                  <label className="label-base">{ar ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}</label>
                  <Input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} placeholder="••••••••" />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{ar ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />{ar ? 'بيانات الشركة' : 'Company Information'}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-slate-400 text-xs">{ar ? 'الاسم (عربي)' : 'Name (AR)'}</p><p className="font-medium text-slate-800">{form.nameAr}</p></div>
                  <div><p className="text-slate-400 text-xs">{ar ? 'الاسم (إنجليزي)' : 'Name (EN)'}</p><p className="font-medium text-slate-800">{form.nameEn}</p></div>
                  <div><p className="text-slate-400 text-xs">{ar ? 'السجل التجاري' : 'CR Number'}</p><p className="font-medium text-slate-800">{form.crNumber}</p></div>
                  <div><p className="text-slate-400 text-xs">{ar ? 'النوع' : 'Type'}</p><p className="font-medium text-slate-800">{form.type === 'BUYER' ? (ar ? 'مشترٍ' : 'Buyer') : (ar ? 'مورّد' : 'Supplier')}</p></div>
                  {form.vatNumber && <div><p className="text-slate-400 text-xs">{ar ? 'الرقم الضريبي' : 'VAT'}</p><p className="font-medium text-slate-800">{form.vatNumber}</p></div>}
                  {form.legalForm && <div><p className="text-slate-400 text-xs">{ar ? 'الشكل القانوني' : 'Legal Form'}</p><p className="font-medium text-slate-800">{LEGAL_FORMS.find((l) => l.value === form.legalForm)?.[ar ? 'ar' : 'en']}</p></div>}
                  {form.establishmentYear && <div><p className="text-slate-400 text-xs">{ar ? 'سنة التأسيس' : 'Est. Year'}</p><p className="font-medium text-slate-800">{form.establishmentYear}</p></div>}
                  {form.companySizeRange && <div><p className="text-slate-400 text-xs">{ar ? 'حجم الشركة' : 'Size'}</p><p className="font-medium text-slate-800">{form.companySizeRange} {ar ? 'موظف' : 'employees'}</p></div>}
                  <div><p className="text-slate-400 text-xs">{ar ? 'المدينة' : 'City'}</p><p className="font-medium text-slate-800">{form.city}</p></div>
                  {form.phone && <div><p className="text-slate-400 text-xs">{ar ? 'الجوال' : 'Phone'}</p><p className="font-medium text-slate-800">{form.phone}</p></div>}
                </div>
                {form.sectors.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">{ar ? 'القطاعات' : 'Sectors'}</p>
                    <div className="flex flex-wrap gap-1">{form.sectors.map((s) => {
                      const i = SECTOR_VALUES.indexOf(s);
                      return <span key={s} className="text-xs bg-brand-50 text-brand-700 border border-brand-100 rounded-full px-2 py-0.5">{ar ? SECTORS_AR[i] : SECTORS_EN[i]}</span>;
                    })}</div>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="h-4 w-4" />{ar ? 'بيانات الحساب' : 'Account Details'}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-slate-400 text-xs">{ar ? 'الاسم' : 'Name'}</p><p className="font-medium text-slate-800">{form.fullName}</p></div>
                  <div><p className="text-slate-400 text-xs">{ar ? 'البريد الإلكتروني' : 'Email'}</p><p className="font-medium text-slate-800">{form.email}</p></div>
                  {form.contactJobTitle && <div><p className="text-slate-400 text-xs">{ar ? 'المسمى الوظيفي' : 'Job Title'}</p><p className="font-medium text-slate-800">{form.contactJobTitle}</p></div>}
                </div>
              </div>

              {form.type === 'SUPPLIER' && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
                  <p className="font-medium mb-0.5">{ar ? 'ملاحظة التحقق' : 'Verification Note'}</p>
                  <p className="text-xs text-amber-600">
                    {ar ? 'سيتم مراجعة ملفك من فريق موازن قبل تفعيل حساب المورد. ستتلقى إشعاراً بالبريد عند الموافقة.' : 'Your supplier account will be reviewed by the Mwazn team before activation. You will be notified by email.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <div>
              {step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)} icon={<ChevronLeft className="h-4 w-4" />}>{ar ? 'السابق' : 'Back'}</Button>}
            </div>
            <div>
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canNext()} icon={<ChevronRight className="h-4 w-4" />} iconPosition="right">
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
