'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { User, Lock, Building2, CheckCircle2, Clock, Zap, Plus, Trash2 } from 'lucide-react';

const SAUDI_REGIONS = [
  'Riyadh', 'Mecca', 'Medina', 'Eastern Province', 'Asir', 'Tabuk',
  'Hail', 'Northern Borders', 'Jizan', 'Najran', 'Al Bahah', 'Al Jouf', 'Qassim',
];

const PAYMENT_TERMS_OPTIONS = [
  { en: 'Cash on Delivery', ar: 'نقداً عند التسليم' },
  { en: 'Net 30', ar: 'صافي 30 يوم' },
  { en: 'Net 60', ar: 'صافي 60 يوم' },
  { en: 'Net 90', ar: 'صافي 90 يوم' },
  { en: '50% Advance', ar: '50% مقدماً' },
  { en: 'Letter of Credit', ar: 'خطاب اعتماد' },
];

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lift ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {message}
    </div>
  );
}

export default function ProfilePage() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const { user, company, refresh } = useAuth();
  const isSupplier = company?.type === 'SUPPLIER';

  // Personal info
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // Company profile (supplier extras)
  const [coverImageUrl, setCoverImageUrl] = useState(company?.coverImageUrl || '');
  const [productionCapacity, setProductionCapacity] = useState(company?.productionCapacity || '');
  const [isoUrl, setIsoUrl] = useState(company?.isoUrl || '');
  const [chamberCertUrl, setChamberCertUrl] = useState(company?.chamberCertUrl || '');
  const [taxCertUrl, setTaxCertUrl] = useState(company?.taxCertUrl || '');
  const [keyClients, setKeyClients] = useState<string[]>(company?.keyClients || []);
  const [newKeyClient, setNewKeyClient] = useState('');
  const [regionsServed, setRegionsServed] = useState<string[]>(company?.regionsServed || []);
  const [paymentTermsAccepted, setPaymentTermsAccepted] = useState<string[]>(
    company?.paymentTermsAccepted || [],
  );
  const [savingCompany, setSavingCompany] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.patch('/auth/profile', { fullName });
      await refresh?.();
      showToast(ar ? 'تم حفظ الملف الشخصي' : 'Profile saved successfully', 'success');
    } catch {
      showToast(ar ? 'حدث خطأ أثناء الحفظ' : 'Failed to save profile', 'error');
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      showToast(ar ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'error');
      return;
    }
    if (newPw.length < 8) {
      showToast(ar ? 'كلمة المرور قصيرة (8 أحرف على الأقل)' : 'Password too short (min 8 chars)', 'error');
      return;
    }
    setSavingPw(true);
    try {
      await api.patch('/auth/password', { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      showToast(ar ? 'تم تغيير كلمة المرور' : 'Password changed successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || (ar ? 'فشل تغيير كلمة المرور' : 'Failed to change password'), 'error');
    }
    setSavingPw(false);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSavingCompany(true);
    try {
      await api.patch(`/companies/${company.id}`, {
        coverImageUrl: coverImageUrl || undefined,
        productionCapacity: productionCapacity || undefined,
        isoUrl: isoUrl || undefined,
        chamberCertUrl: chamberCertUrl || undefined,
        taxCertUrl: taxCertUrl || undefined,
        keyClients,
        regionsServed,
        paymentTermsAccepted,
      });
      await refresh?.();
      showToast(ar ? 'تم حفظ ملف الشركة' : 'Company profile saved', 'success');
    } catch {
      showToast(ar ? 'فشل حفظ ملف الشركة' : 'Failed to save company profile', 'error');
    }
    setSavingCompany(false);
  };

  const addKeyClient = () => {
    const v = newKeyClient.trim();
    if (v && !keyClients.includes(v)) {
      setKeyClients([...keyClients, v]);
    }
    setNewKeyClient('');
  };

  const toggleRegion = (region: string) => {
    setRegionsServed((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region],
    );
  };

  const togglePaymentTerm = (term: string) => {
    setPaymentTermsAccepted((prev) =>
      prev.includes(term) ? prev.filter((t) => t !== term) : [...prev, term],
    );
  };

  const initials = (user?.fullName || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{ar ? 'الملف الشخصي' : 'Profile'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {ar ? 'إدارة معلومات حسابك الشخصي' : 'Manage your personal account information'}
          </p>
        </div>

        {/* Avatar + Personal Info */}
        <div className="card space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-white text-2xl font-bold">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{user?.fullName}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {ar ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-base w-full"
                placeholder={ar ? 'الاسم الكامل' : 'Full Name'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {ar ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                value={user?.email || ''}
                readOnly
                className="input-base w-full bg-slate-50 text-slate-400 cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <User className="h-4 w-4" />
              {savingProfile ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? 'حفظ التغييرات' : 'Save Changes')}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-slate-600" />
            <h2 className="font-semibold text-slate-800">{ar ? 'تغيير كلمة المرور' : 'Change Password'}</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {ar ? 'كلمة المرور الحالية' : 'Current Password'}
              </label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="input-base w-full"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {ar ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="input-base w-full"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {ar ? 'تأكيد كلمة المرور' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="input-base w-full"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={savingPw}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Lock className="h-4 w-4" />
              {savingPw ? (ar ? 'جاري التحديث...' : 'Updating...') : (ar ? 'تغيير كلمة المرور' : 'Change Password')}
            </button>
          </form>
        </div>

        {/* Company Info (readonly summary) */}
        {company && (
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-600" />
              <h2 className="font-semibold text-slate-800">{ar ? 'معلومات الشركة' : 'Company Information'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">{ar ? 'الاسم بالعربية' : 'Arabic Name'}</p>
                <p className="text-sm font-medium text-slate-800">{company.nameAr}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">{ar ? 'الاسم بالإنجليزية' : 'English Name'}</p>
                <p className="text-sm font-medium text-slate-800">{company.nameEn}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">{ar ? 'رقم السجل التجاري' : 'CR Number'}</p>
                <p className="text-sm font-medium text-slate-800">{company.crNumber}</p>
              </div>
              {company.vatNumber && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">{ar ? 'الرقم الضريبي' : 'VAT Number'}</p>
                  <p className="text-sm font-medium text-slate-800">{company.vatNumber}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-1">{ar ? 'المدينة' : 'City'}</p>
                <p className="text-sm font-medium text-slate-800">{company.city || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">{ar ? 'نوع الشركة' : 'Company Type'}</p>
                <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                  {company.type}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">{ar ? 'حالة السجل التجاري' : 'CR Verification'}</p>
                {company.verificationStatus === 'VERIFIED' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    {ar ? 'سجل تجاري موثّق' : 'CR Verified'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    <Clock className="h-3 w-3" />
                    {ar ? 'قيد مراجعة السجل التجاري' : 'CR Doc Under Review'}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">{ar ? 'خطة الاشتراك' : 'Plan'}</p>
                {company.plan === 'PRO' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    <Zap className="h-3 w-3" /> PRO
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    FREE
                  </span>
                )}
              </div>
              {company.legalForm && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">{ar ? 'الشكل القانوني' : 'Legal Form'}</p>
                  <p className="text-sm font-medium text-slate-800">{company.legalForm}</p>
                </div>
              )}
              {company.establishmentYear && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">{ar ? 'سنة التأسيس' : 'Est. Year'}</p>
                  <p className="text-sm font-medium text-slate-800">{company.establishmentYear}</p>
                </div>
              )}
              {company.sectors && company.sectors.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 mb-1">{ar ? 'القطاعات' : 'Sectors'}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {company.sectors.map((s) => (
                      <span key={s} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Supplier Profile Extras */}
        {isSupplier && company && (
          <div className="card space-y-6">
            <div>
              <h2 className="font-semibold text-slate-800">{ar ? 'ملف المورّد' : 'Supplier Profile'}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {ar ? 'معلومات تظهر في صفحة الشركة العامة' : 'Shown on your public company page'}
              </p>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-6">
              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {ar ? 'رابط صورة الغلاف' : 'Cover Image URL'}
                </label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="input-base w-full"
                  placeholder="https://..."
                />
                {coverImageUrl && (
                  <img
                    src={coverImageUrl}
                    alt="cover preview"
                    className="mt-2 h-24 w-full object-cover rounded-lg border border-slate-100"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>

              {/* Production Capacity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {ar ? 'الطاقة الإنتاجية' : 'Production Capacity'}
                </label>
                <input
                  value={productionCapacity}
                  onChange={(e) => setProductionCapacity(e.target.value)}
                  className="input-base w-full"
                  placeholder={ar ? 'مثال: 500 وحدة شهرياً' : 'e.g. 500 units/month'}
                />
              </div>

              {/* Key Clients */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {ar ? 'العملاء الرئيسيون' : 'Key Clients'}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {keyClients.map((client, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                      {client}
                      <button
                        type="button"
                        onClick={() => setKeyClients(keyClients.filter((_, i) => i !== idx))}
                        className="text-brand-400 hover:text-brand-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newKeyClient}
                    onChange={(e) => setNewKeyClient(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyClient(); } }}
                    className="input-base flex-1"
                    placeholder={ar ? 'اسم العميل ثم Enter' : 'Client name then Enter'}
                  />
                  <button
                    type="button"
                    onClick={addKeyClient}
                    className="btn-secondary inline-flex items-center gap-1 text-sm px-3"
                  >
                    <Plus className="h-4 w-4" />
                    {ar ? 'إضافة' : 'Add'}
                  </button>
                </div>
              </div>

              {/* Regions Served */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {ar ? 'المناطق التي تخدمها' : 'Regions Served'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SAUDI_REGIONS.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        regionsServed.includes(region)
                          ? 'border-brand-700 bg-brand-700 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {ar ? 'شروط الدفع المقبولة' : 'Accepted Payment Terms'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_TERMS_OPTIONS.map((opt) => {
                    const label = ar ? opt.ar : opt.en;
                    const val = opt.en;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => togglePaymentTerm(val)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          paymentTermsAccepted.includes(val)
                            ? 'border-brand-700 bg-brand-700 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compliance Documents */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  {ar ? 'روابط وثائق الامتثال' : 'Compliance Document URLs'}
                </label>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {ar ? 'شهادة الأيزو (ISO)' : 'ISO Certificate'}
                  </label>
                  <input
                    type="url"
                    value={isoUrl}
                    onChange={(e) => setIsoUrl(e.target.value)}
                    className="input-base w-full"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {ar ? 'شهادة الغرفة التجارية' : 'Chamber of Commerce Certificate'}
                  </label>
                  <input
                    type="url"
                    value={chamberCertUrl}
                    onChange={(e) => setChamberCertUrl(e.target.value)}
                    className="input-base w-full"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {ar ? 'شهادة التسجيل الضريبي' : 'Tax Registration Certificate'}
                  </label>
                  <input
                    type="url"
                    value={taxCertUrl}
                    onChange={(e) => setTaxCertUrl(e.target.value)}
                    className="input-base w-full"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingCompany}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <Building2 className="h-4 w-4" />
                {savingCompany
                  ? (ar ? 'جاري الحفظ...' : 'Saving...')
                  : (ar ? 'حفظ ملف المورّد' : 'Save Supplier Profile')}
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
