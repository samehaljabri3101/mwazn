'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Building2, User, CheckCircle2, ChevronRight, ChevronLeft,
  Briefcase, UserCircle,
} from 'lucide-react';

type RegistrationType = 'BUSINESS' | 'FREELANCER' | 'CUSTOMER';

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

interface BusinessForm {
  nameAr: string; nameEn: string; crNumber: string;
  crExpiryDate: string; vatNumber: string; legalForm: string;
  establishmentYear: string; companySizeRange: string; sectors: string[];
  city: string; phone: string;
  fullName: string; contactJobTitle: string; email: string;
  password: string; confirmPassword: string;
}

interface IndividualForm {
  fullName: string; email: string; password: string; confirmPassword: string;
  city: string; phone: string; bio: string; nationalId: string;
  businessPlatformNumber: string;
}

export default function RegisterPage() {
  const locale = useLocale();
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const ar = locale === 'ar';

  useEffect(() => {
    if (!isLoading && user) router.replace(`/${locale}/dashboard`);
  }, [isLoading, user, locale, router]);

  // Step 0 = type selection; then steps 1+ depend on type
  const [regType, setRegType] = useState<RegistrationType | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [biz, setBiz] = useState<BusinessForm>({
    nameAr: '', nameEn: '', crNumber: '',
    crExpiryDate: '', vatNumber: '', legalForm: '',
    establishmentYear: '', companySizeRange: '', sectors: [],
    city: '', phone: '',
    fullName: '', contactJobTitle: '', email: '',
    password: '', confirmPassword: '',
  });

  const [ind, setInd] = useState<IndividualForm>({
    fullName: '', email: '', password: '', confirmPassword: '',
    city: '', phone: '', bio: '', nationalId: '', businessPlatformNumber: '',
  });

  const setBizField = (key: keyof BusinessForm, value: string) =>
    setBiz((p) => ({ ...p, [key]: value }));
  const setIndField = (key: keyof IndividualForm, value: string) =>
    setInd((p) => ({ ...p, [key]: value }));
  const toggleSector = (val: string) =>
    setBiz((p) => ({
      ...p,
      sectors: p.sectors.includes(val) ? p.sectors.filter((s) => s !== val) : [...p.sectors, val],
    }));

  const isBusiness = regType === 'BUSINESS';
  const isFreelancer = regType === 'FREELANCER';
  const isCustomer = regType === 'CUSTOMER';

  // ── Business: 3 steps (company info → account → review) ──────────────────
  const bizCanNext = () => {
    if (step === 1) return biz.nameAr && biz.nameEn && /^\d{10}$/.test(biz.crNumber) && biz.city;
    if (step === 2) return biz.fullName && biz.email && biz.password.length >= 8 && biz.password === biz.confirmPassword;
    return true;
  };

  // ── Individual (Freelancer/Customer): 1 step ──────────────────────────────
  const indCanSubmit = () =>
    ind.fullName && ind.email && ind.password.length >= 8 && ind.password === ind.confirmPassword;

  const handleBusinessSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const endpoint = '/auth/register/supplier';
      await api.post(endpoint, {
        companyNameAr: biz.nameAr, companyNameEn: biz.nameEn,
        crNumber: biz.crNumber,
        crExpiryDate: biz.crExpiryDate || undefined,
        vatNumber: biz.vatNumber || undefined,
        legalForm: biz.legalForm || undefined,
        establishmentYear: biz.establishmentYear ? Number(biz.establishmentYear) : undefined,
        companySizeRange: biz.companySizeRange || undefined,
        sectors: biz.sectors.length > 0 ? biz.sectors : undefined,
        city: biz.city, phone: biz.phone || undefined,
        fullName: biz.fullName, contactJobTitle: biz.contactJobTitle || undefined,
        email: biz.email, password: biz.password,
      });
      await login(biz.email, biz.password);
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || (ar ? 'حدث خطأ. حاول مجدداً.' : 'Registration failed. Please try again.'));
      setStep(1);
    } finally { setLoading(false); }
  };

  const handleIndividualSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const endpoint = isFreelancer ? '/auth/register/freelancer' : '/auth/register/customer';
      const payload: any = {
        fullName: ind.fullName, email: ind.email, password: ind.password,
        city: ind.city || undefined, phone: ind.phone || undefined,
      };
      if (isFreelancer) {
        if (ind.nationalId) payload.nationalId = ind.nationalId;
        if (ind.bio) payload.bio = ind.bio;
        if (ind.businessPlatformNumber) payload.businessPlatformNumber = ind.businessPlatformNumber;
      }
      await api.post(endpoint, payload);
      await login(ind.email, ind.password);
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || (ar ? 'حدث خطأ. حاول مجدداً.' : 'Registration failed. Please try again.'));
    } finally { setLoading(false); }
  };

  // ── Type cards ───────────────────────────────────────────────────────────
  const typeOptions: Array<{ type: RegistrationType; icon: React.ReactNode; titleEn: string; titleAr: string; descEn: string; descAr: string; badge?: string }> = [
    {
      type: 'BUSINESS',
      icon: <Building2 className="h-5 w-5" />,
      titleEn: 'Business', titleAr: 'شركة / مؤسسة',
      descEn: 'Company account with CR — buy, sell, list products, manage deals',
      descAr: 'حساب شركة بسجل تجاري — اشترِ، بِع، أضف منتجات، وأدر الصفقات',
      badge: 'CR Required',
    },
    {
      type: 'FREELANCER',
      icon: <Briefcase className="h-5 w-5" />,
      titleEn: 'Freelancer', titleAr: 'بائع مستقل',
      descEn: 'Individual seller — list products/services and respond to RFQs without a CR',
      descAr: 'بائع فردي — أضف منتجات وخدمات وقدّم عروضاً بدون سجل تجاري',
      badge: 'No CR required',
    },
    {
      type: 'CUSTOMER',
      icon: <UserCircle className="h-5 w-5" />,
      titleEn: 'Customer', titleAr: 'مستهلك',
      descEn: 'Individual buyer — browse, compare suppliers, and post buying requests',
      descAr: 'مشترٍ فردي — تصفح الموردين وقارن وأنشر طلبات الشراء',
      badge: 'Personal Buyer',
    },
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

        {/* ── Step 0: Account Type Selection ───────────────────────────────── */}
        {step === 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              {ar ? 'اختر نوع الحساب' : 'Choose Account Type'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {ar ? 'اختر النوع المناسب لبدء التسجيل' : 'Select the type that best describes you to get started'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {typeOptions.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => { setRegType(opt.type); setStep(1); setError(''); }}
                  className="rounded-xl border-2 border-slate-200 p-4 text-start hover:border-brand-700 hover:bg-brand-50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white transition-all">
                      {opt.icon}
                    </div>
                    {opt.badge && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-sm text-slate-800">{ar ? opt.titleAr : opt.titleEn}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{ar ? opt.descAr : opt.descEn}</p>
                </button>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-slate-500">
              {ar ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
              <Link href={`/${locale}/auth/login`} className="text-brand-700 font-medium hover:underline">
                {ar ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
            </p>
          </div>
        )}

        {/* ── Business Registration (Buyer or Supplier) ────────────────────── */}
        {step > 0 && isBusiness && (
          <>
            {/* Step indicator */}
            {(() => {
              const steps = [
                { label: ar ? 'بيانات الشركة' : 'Company Info', icon: <Building2 className="h-4 w-4" /> },
                { label: ar ? 'بيانات الحساب' : 'Account Details', icon: <User className="h-4 w-4" /> },
                { label: ar ? 'مراجعة وإرسال' : 'Review & Submit', icon: <CheckCircle2 className="h-4 w-4" /> },
              ];
              return (
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
              );
            })()}

            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <button type="button" onClick={() => { setStep(0); setRegType(null); }} className="text-xs text-slate-400 hover:text-slate-600">
                  ← {ar ? 'تغيير النوع' : 'Change type'}
                </button>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-medium text-brand-700">
                  {ar ? 'شركة / مؤسسة' : 'Business'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">
                {step === 1 ? (ar ? 'بيانات الشركة' : 'Company Info') : step === 2 ? (ar ? 'بيانات الحساب' : 'Account Details') : (ar ? 'مراجعة وإرسال' : 'Review & Submit')}
              </h2>
              <p className="text-sm text-slate-500 mb-6">{ar ? `الخطوة ${step} من 3` : `Step ${step} of 3`}</p>

              {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}

              {/* Step 1: Company Info */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-base">{ar ? 'اسم الشركة (عربي) *' : 'Company Name (AR) *'}</label>
                      <Input value={biz.nameAr} onChange={(e) => setBizField('nameAr', e.target.value)} placeholder="مثال: شركة الأمل" dir="rtl" />
                    </div>
                    <div>
                      <label className="label-base">{ar ? 'اسم الشركة (إنجليزي) *' : 'Company Name (EN) *'}</label>
                      <Input value={biz.nameEn} onChange={(e) => setBizField('nameEn', e.target.value)} placeholder="e.g. Al Amal Co." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-base">{ar ? 'رقم السجل التجاري *' : 'CR Number *'}</label>
                      <Input value={biz.crNumber} onChange={(e) => setBizField('crNumber', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10 digits" maxLength={10} />
                    </div>
                    <div>
                      <label className="label-base">{ar ? 'تاريخ انتهاء السجل' : 'CR Expiry Date'}</label>
                      <Input type="date" value={biz.crExpiryDate} onChange={(e) => setBizField('crExpiryDate', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-base">{ar ? 'الرقم الضريبي (VAT)' : 'VAT Number'}</label>
                      <Input value={biz.vatNumber} onChange={(e) => setBizField('vatNumber', e.target.value.replace(/\D/g, '').slice(0, 15))} placeholder="310000000000003" />
                    </div>
                    <div>
                      <label className="label-base">{ar ? 'الشكل القانوني' : 'Legal Form'}</label>
                      <select value={biz.legalForm} onChange={(e) => setBizField('legalForm', e.target.value)} className="input-base">
                        <option value="">{ar ? 'اختر' : 'Select'}</option>
                        {LEGAL_FORMS.map((lf) => <option key={lf.value} value={lf.value}>{ar ? lf.ar : lf.en}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-base">{ar ? 'سنة التأسيس' : 'Establishment Year'}</label>
                      <Input type="number" min="1900" max={new Date().getFullYear()} value={biz.establishmentYear} onChange={(e) => setBizField('establishmentYear', e.target.value)} placeholder="2010" />
                    </div>
                    <div>
                      <label className="label-base">{ar ? 'حجم الشركة' : 'Company Size'}</label>
                      <select value={biz.companySizeRange} onChange={(e) => setBizField('companySizeRange', e.target.value)} className="input-base">
                        <option value="">{ar ? 'عدد الموظفين' : 'No. of employees'}</option>
                        {SIZE_RANGES.map((s) => <option key={s} value={s}>{s} {ar ? 'موظف' : 'employees'}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label-base">{ar ? 'القطاعات' : 'Sectors'}</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SECTOR_VALUES.map((val, i) => (
                        <button key={val} type="button" onClick={() => toggleSector(val)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${biz.sectors.includes(val) ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'}`}>
                          {ar ? SECTORS_AR[i] : SECTORS_EN[i]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-base">{ar ? 'المدينة *' : 'City *'}</label>
                      <select value={biz.city} onChange={(e) => setBizField('city', e.target.value)} className="input-base">
                        <option value="">{ar ? 'اختر المدينة' : 'Select city'}</option>
                        {(ar ? SAUDI_CITIES_AR : SAUDI_CITIES_EN).map((city, i) => (
                          <option key={city} value={SAUDI_CITIES_EN[i]}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label-base">{ar ? 'رقم الجوال' : 'Phone Number'}</label>
                      <Input value={biz.phone} onChange={(e) => setBizField('phone', e.target.value)} placeholder="+966 5X XXX XXXX" type="tel" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Account Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-base">{ar ? 'الاسم الكامل *' : 'Full Name *'}</label>
                      <Input value={biz.fullName} onChange={(e) => setBizField('fullName', e.target.value)} placeholder={ar ? 'محمد العمري' : 'Mohammed Al-Omari'} />
                    </div>
                    <div>
                      <label className="label-base">{ar ? 'المسمى الوظيفي' : 'Job Title'}</label>
                      <Input value={biz.contactJobTitle} onChange={(e) => setBizField('contactJobTitle', e.target.value)} placeholder={ar ? 'مثال: مدير المشتريات' : 'e.g. Procurement Manager'} />
                    </div>
                  </div>
                  <div>
                    <label className="label-base">{ar ? 'البريد الإلكتروني *' : 'Email Address *'}</label>
                    <Input type="email" value={biz.email} onChange={(e) => setBizField('email', e.target.value)} placeholder="admin@company.sa" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-base">{ar ? 'كلمة المرور *' : 'Password *'}</label>
                      <Input type="password" value={biz.password} onChange={(e) => setBizField('password', e.target.value)} placeholder="••••••••" />
                      <p className="text-xs text-slate-400 mt-1">{ar ? '8 أحرف على الأقل' : 'At least 8 characters'}</p>
                    </div>
                    <div>
                      <label className="label-base">{ar ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}</label>
                      <Input type="password" value={biz.confirmPassword} onChange={(e) => setBizField('confirmPassword', e.target.value)} placeholder="••••••••" />
                      {biz.confirmPassword && biz.password !== biz.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">{ar ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />{ar ? 'بيانات الشركة' : 'Company Information'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><p className="text-slate-400 text-xs">{ar ? 'الاسم (عربي)' : 'Name (AR)'}</p><p className="font-medium text-slate-800">{biz.nameAr}</p></div>
                      <div><p className="text-slate-400 text-xs">{ar ? 'الاسم (إنجليزي)' : 'Name (EN)'}</p><p className="font-medium text-slate-800">{biz.nameEn}</p></div>
                      <div><p className="text-slate-400 text-xs">{ar ? 'السجل التجاري' : 'CR Number'}</p><p className="font-medium text-slate-800">{biz.crNumber}</p></div>
                      <div><p className="text-slate-400 text-xs">{ar ? 'المدينة' : 'City'}</p><p className="font-medium text-slate-800">{biz.city}</p></div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <User className="h-4 w-4" />{ar ? 'بيانات الحساب' : 'Account Details'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><p className="text-slate-400 text-xs">{ar ? 'الاسم' : 'Name'}</p><p className="font-medium text-slate-800">{biz.fullName}</p></div>
                      <div><p className="text-slate-400 text-xs">{ar ? 'البريد الإلكتروني' : 'Email'}</p><p className="font-medium text-slate-800">{biz.email}</p></div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
                    <p className="font-medium mb-0.5">{ar ? 'مراجعة السجل التجاري' : 'CR Document Review'}</p>
                    <p className="text-xs text-amber-600">
                      {ar
                        ? 'سيتم تفعيل حسابك بعد مراجعة السجل التجاري، عادةً خلال 24 ساعة.'
                        : 'Your business account will be activated after CR document review, usually within 24 hours.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-8">
                <div>
                  {step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)} icon={<ChevronLeft className="h-4 w-4" />}>{ar ? 'السابق' : 'Back'}</Button>}
                </div>
                <div>
                  {step < 3 ? (
                    <Button onClick={() => setStep(step + 1)} disabled={!bizCanNext()} icon={<ChevronRight className="h-4 w-4" />} iconPosition="right">
                      {ar ? 'التالي' : 'Next'}
                    </Button>
                  ) : (
                    <Button onClick={handleBusinessSubmit} loading={loading} icon={<CheckCircle2 className="h-4 w-4" />}>
                      {ar ? 'إنشاء الحساب' : 'Create Account'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Individual Registration (Freelancer / Customer) ───────────────── */}
        {step === 1 && (isFreelancer || isCustomer) && (
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <button type="button" onClick={() => { setStep(0); setRegType(null); }} className="text-xs text-slate-400 hover:text-slate-600">
                ← {ar ? 'تغيير النوع' : 'Change type'}
              </button>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-medium text-brand-700">
                {isFreelancer ? (ar ? 'بائع مستقل' : 'Freelancer') : (ar ? 'مستهلك' : 'Customer')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              {ar ? 'بيانات حسابك' : 'Your Account Details'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {isFreelancer
                ? (ar ? 'بِع منتجاتك وخدماتك بدون سجل تجاري' : 'Sell products and services without a commercial registration')
                : (ar ? 'تصفح الموردين وقارن الأسعار وانشر طلبات الشراء' : 'Browse suppliers, compare prices, and post buying requests')}
            </p>

            {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="label-base">{ar ? 'الاسم الكامل *' : 'Full Name *'}</label>
                <Input value={ind.fullName} onChange={(e) => setIndField('fullName', e.target.value)} placeholder={ar ? 'خالد العتيبي' : 'Khalid Al-Otaibi'} />
              </div>
              <div>
                <label className="label-base">{ar ? 'البريد الإلكتروني *' : 'Email Address *'}</label>
                <Input type="email" value={ind.email} onChange={(e) => setIndField('email', e.target.value)} placeholder="khalid@example.sa" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">{ar ? 'كلمة المرور *' : 'Password *'}</label>
                  <Input type="password" value={ind.password} onChange={(e) => setIndField('password', e.target.value)} placeholder="••••••••" />
                  <p className="text-xs text-slate-400 mt-1">{ar ? '8 أحرف على الأقل' : 'At least 8 characters'}</p>
                </div>
                <div>
                  <label className="label-base">{ar ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}</label>
                  <Input type="password" value={ind.confirmPassword} onChange={(e) => setIndField('confirmPassword', e.target.value)} placeholder="••••••••" />
                  {ind.confirmPassword && ind.password !== ind.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{ar ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">{ar ? 'المدينة' : 'City'}</label>
                  <select value={ind.city} onChange={(e) => setIndField('city', e.target.value)} className="input-base">
                    <option value="">{ar ? 'اختر (اختياري)' : 'Optional'}</option>
                    {(ar ? SAUDI_CITIES_AR : SAUDI_CITIES_EN).map((city, i) => (
                      <option key={city} value={SAUDI_CITIES_EN[i]}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base">{ar ? 'رقم الجوال' : 'Phone'}</label>
                  <Input value={ind.phone} onChange={(e) => setIndField('phone', e.target.value)} placeholder="+966 5X XXX XXXX" type="tel" />
                </div>
              </div>
              {isFreelancer && (
                <>
                  <div>
                    <label className="label-base">{ar ? 'رقم الهوية الوطنية / الإقامة' : 'National ID / Iqama'} <span className="text-slate-400 text-xs">({ar ? 'اختياري' : 'optional'})</span></label>
                    <Input value={ind.nationalId} onChange={(e) => setIndField('nationalId', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10 digits" maxLength={10} />
                  </div>
                  <div>
                    <label className="label-base">{ar ? 'رقم منصة الأعمال' : 'Business Platform No.'} <span className="text-slate-400 text-xs">({ar ? 'اختياري' : 'optional'})</span></label>
                    <Input value={ind.businessPlatformNumber} onChange={(e) => setIndField('businessPlatformNumber', e.target.value)} placeholder="e.g. SA12-345678" />
                    <p className="text-xs text-slate-400 mt-1">{ar ? 'من منصة الأعمال السعودية' : 'From the Saudi Business Platform (منصة الأعمال السعودية)'}</p>
                  </div>
                  <div>
                    <label className="label-base">{ar ? 'نبذة عنك' : 'Bio'} <span className="text-slate-400 text-xs">({ar ? 'اختياري' : 'optional'})</span></label>
                    <Input value={ind.bio} onChange={(e) => setIndField('bio', e.target.value)} placeholder={ar ? 'خبراتك ومجالات عملك...' : 'Your skills and areas of work...'} />
                  </div>
                </>
              )}

              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
                <p className="font-medium mb-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {isFreelancer ? (ar ? 'لا يشترط سجل تجاري' : 'No CR required') : (ar ? 'حساب مشترٍ شخصي' : 'Personal Buyer account')}
                </p>
                <p className="text-xs text-emerald-600">
                  {isFreelancer
                    ? (ar ? 'لا تحتاج إلى سجل تجاري. ابدأ بإضافة منتجاتك فوراً.' : 'No commercial registration needed. Start listing right away.')
                    : (ar ? 'تصفح الموردين وقارن الأسعار وانشر طلبات الشراء.' : 'Browse suppliers, compare prices, and post buying requests.')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8">
              <Button variant="secondary" onClick={() => { setStep(0); setRegType(null); }} icon={<ChevronLeft className="h-4 w-4" />}>
                {ar ? 'السابق' : 'Back'}
              </Button>
              <Button onClick={handleIndividualSubmit} loading={loading} disabled={!indCanSubmit()} icon={<CheckCircle2 className="h-4 w-4" />}>
                {ar ? 'إنشاء الحساب' : 'Create Account'}
              </Button>
            </div>
          </div>
        )}

        {step === 0 ? null : (
          <p className="mt-6 text-center text-sm text-slate-500">
            {ar ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
            <Link href={`/${locale}/auth/login`} className="text-brand-700 font-medium hover:underline">
              {ar ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
