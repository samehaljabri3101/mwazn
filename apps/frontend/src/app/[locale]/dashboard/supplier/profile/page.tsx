'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';

const PLATFORM_OPTIONS = [
  { value: 'ZID', label: 'Zid / زد' },
  { value: 'SALLA', label: 'Salla / سلة' },
  { value: 'OTHER', label: 'Other / أخرى' },
];

export default function SupplierProfilePage() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const { company } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    hasExternalStore: false,
    externalStorePlatform: '',
    externalStoreUrl: '',
    externalStoreName: '',
    allowDirectOrder: false,
  });

  useEffect(() => {
    if (!company?.id) return;
    api
      .get(`/companies/${company.id}`)
      .then((res) => {
        const c = res.data.data ?? res.data;
        setForm({
          hasExternalStore: c.hasExternalStore ?? false,
          externalStorePlatform: c.externalStorePlatform ?? '',
          externalStoreUrl: c.externalStoreUrl ?? '',
          externalStoreName: c.externalStoreName ?? '',
          allowDirectOrder: c.allowDirectOrder ?? false,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [company?.id]);

  const handleSave = async () => {
    if (!company?.id) return;
    setSaving(true);
    try {
      await api.patch(`/companies/${company.id}`, {
        hasExternalStore: form.hasExternalStore,
        externalStorePlatform: form.externalStorePlatform || null,
        externalStoreUrl: form.externalStoreUrl || null,
        externalStoreName: form.externalStoreName || null,
        allowDirectOrder: form.allowDirectOrder,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* silent */ }
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-xl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl space-y-6">
        <h1 className="text-xl font-bold text-slate-800">
          {ar ? 'ملف الشركة' : 'Company Profile'}
        </h1>

        {/* External Store Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <ShoppingBag className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-slate-800">
              {ar ? 'المتجر الإلكتروني' : 'External Store Integration'}
            </h2>
          </div>

          <div className="space-y-4">
            {/* hasExternalStore toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-slate-700 text-sm">
                  {ar ? 'لدي متجر إلكتروني' : 'I have an external store'}
                </p>
                <p className="text-xs text-slate-400">
                  {ar
                    ? 'اربط متجرك على Zid أو Salla مع ملفك في موازن'
                    : 'Link your Zid or Salla store to your Mwazn profile'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, hasExternalStore: !f.hasExternalStore }))}
                className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none ${
                  form.hasExternalStore ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    form.hasExternalStore ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            {form.hasExternalStore && (
              <>
                {/* Platform select */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {ar ? 'المنصة' : 'Platform'}
                  </label>
                  <select
                    value={form.externalStorePlatform}
                    onChange={(e) => setForm((f) => ({ ...f, externalStorePlatform: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    <option value="">{ar ? 'اختر المنصة' : 'Select platform'}</option>
                    {PLATFORM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Store URL */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {ar ? 'رابط المتجر' : 'Store URL'}
                  </label>
                  <input
                    type="url"
                    value={form.externalStoreUrl}
                    onChange={(e) => setForm((f) => ({ ...f, externalStoreUrl: e.target.value }))}
                    placeholder="https://mystore.zid.sa"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>

                {/* Store name */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {ar ? 'اسم المتجر' : 'Store Name'}
                  </label>
                  <input
                    type="text"
                    value={form.externalStoreName}
                    onChange={(e) => setForm((f) => ({ ...f, externalStoreName: e.target.value }))}
                    placeholder={ar ? 'متجري الإلكتروني' : 'My Online Store'}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>

                {/* allowDirectOrder toggle */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-slate-700 text-sm">
                      {ar ? 'السماح بالطلب المباشر' : 'Allow Direct Orders'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {ar
                        ? 'يعرض زر "اطلب الآن" على صفحة منتجاتك'
                        : 'Shows an "Order Now" button on your product pages'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, allowDirectOrder: !f.allowDirectOrder }))}
                    className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none ${
                      form.allowDirectOrder ? 'bg-brand-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        form.allowDirectOrder ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </label>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} loading={saving}>
            {ar ? 'حفظ التغييرات' : 'Save Changes'}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {ar ? 'تم الحفظ' : 'Saved'}
            </span>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
