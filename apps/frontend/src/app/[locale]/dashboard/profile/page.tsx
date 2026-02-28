'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { User, Lock, Building2, CheckCircle2, Clock, Zap } from 'lucide-react';

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

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

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

        {/* Company Info (readonly) */}
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
                <p className="text-xs text-slate-500 mb-1">{ar ? 'حالة التوثيق' : 'Verification'}</p>
                {company.verificationStatus === 'VERIFIED' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    {ar ? 'موثق' : 'Verified'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    <Clock className="h-3 w-3" />
                    {ar ? 'قيد المراجعة' : 'Pending'}
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
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
