'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft, Package, Building2, Tag, Banknote, Calendar,
  Shield, Flag, Trash2, RotateCcw, Image as ImageIcon,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminListingDetail {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  status: string;
  moderationStatus: string;
  moderationSource?: string;
  moderationReason?: string;
  moderatedAt?: string;
  price?: number;
  currency: string;
  unit?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  tags?: string[];
  createdAt: string;
  supplier?: { id: string; nameAr: string; nameEn: string };
  category?: { nameAr: string; nameEn: string };
  images?: { id: string; url: string; isPrimary: boolean }[];
  _count?: { quotes: number };
}

const MOD_STATUS_META: Record<string, { bg: string; text: string; labelEn: string; labelAr: string }> = {
  ACTIVE:   { bg: 'bg-emerald-100', text: 'text-emerald-700', labelEn: 'Active',   labelAr: 'نشط'      },
  FLAGGED:  { bg: 'bg-amber-100',   text: 'text-amber-700',   labelEn: 'Flagged',  labelAr: 'مُعلَّم'   },
  REMOVED:  { bg: 'bg-red-100',     text: 'text-red-700',     labelEn: 'Removed',  labelAr: 'محذوف'    },
  REJECTED: { bg: 'bg-rose-100',    text: 'text-rose-700',    labelEn: 'Rejected', labelAr: 'مرفوض'    },
};

function InfoField({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminListingDetailPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;

  const [listing, setListing] = useState<AdminListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removeReason, setRemoveReason] = useState('');

  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      // Use the admin listings detail view via the regular listings endpoint (admin bypass via JWT)
      const res = await api.get(`/listings/${params.id}`);
      setListing(res.data?.data ?? res.data);
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

  const doAction = async (action: 'remove' | 'restore' | 'flag', reason?: string) => {
    setActionLoading(action);
    try {
      await api.patch(`/admin/listings/${params.id}/${action}`, reason ? { reason } : {});
      await fetchListing();
    } catch { /* silent */ }
    setActionLoading(null);
    setConfirmRemove(false);
    setRemoveReason('');
  };

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`${base}/admin/listings`} className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {loading ? (ar ? 'جارٍ التحميل...' : 'Loading…') : (ar ? listing?.titleAr : listing?.titleEn) ?? (ar ? 'تفاصيل المنتج' : 'Listing Detail')}
            </h1>
            <p className="text-sm text-slate-400">{ar ? 'تفاصيل المنتج — عرض المشرف' : 'Listing Detail — Admin View'}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : notFound || !listing ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <Package className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'المنتج غير موجود' : 'Listing not found'}</p>
            <Link href={`${base}/admin/listings`} className="mt-3 text-xs text-brand-600 hover:underline">
              {ar ? 'العودة للقائمة' : 'Back to listings'}
            </Link>
          </div>
        ) : (
          <>
            {/* Main details card */}
            <div className="card">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{ar ? listing.titleAr : listing.titleEn}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ar ? listing.titleEn : listing.titleAr}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                    listing.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                    listing.status === 'INACTIVE' ? 'bg-slate-100 text-slate-500' :
                    'bg-rose-100 text-rose-600'
                  }`}>
                    {listing.status}
                  </span>
                  {(() => {
                    const m = MOD_STATUS_META[listing.moderationStatus] ?? MOD_STATUS_META.ACTIVE;
                    return (
                      <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold ${m.bg} ${m.text}`}>
                        <Shield className="h-3 w-3" />
                        {ar ? m.labelAr : m.labelEn}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 mb-5">
                <InfoField
                  label={ar ? 'المورد' : 'Supplier'}
                  value={
                    <Link href={`${base}/admin/companies/${listing.supplier?.id}`} className="text-brand-600 hover:underline">
                      {ar ? listing.supplier?.nameAr : listing.supplier?.nameEn}
                    </Link>
                  }
                />
                <InfoField label={ar ? 'الفئة' : 'Category'} value={ar ? listing.category?.nameAr : listing.category?.nameEn} />
                <InfoField label={ar ? 'السعر' : 'Price'} value={listing.price ? `${listing.price.toLocaleString()} ${listing.currency}` : '—'} />
                {listing.unit && <InfoField label={ar ? 'الوحدة' : 'Unit'} value={listing.unit} />}
                {listing.minOrderQty && <InfoField label={ar ? 'الحد الأدنى' : 'Min Order'} value={String(listing.minOrderQty)} />}
                {listing.leadTimeDays && <InfoField label={ar ? 'مدة التوريد' : 'Lead Time'} value={`${listing.leadTimeDays} ${ar ? 'يوم' : 'days'}`} />}
                <InfoField label={ar ? 'تاريخ الإنشاء' : 'Created'} value={fmtDate(listing.createdAt)} />
                {listing._count && <InfoField label={ar ? 'عدد العروض' : 'Quotes'} value={String(listing._count.quotes)} />}
              </div>

              {(listing.descriptionEn || listing.descriptionAr) && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{ar ? 'الوصف' : 'Description'}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {ar ? (listing.descriptionAr ?? listing.descriptionEn) : (listing.descriptionEn ?? listing.descriptionAr)}
                  </p>
                </div>
              )}

              {listing.tags && listing.tags.length > 0 && (
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{ar ? 'الوسوم' : 'Tags'}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                        <Tag className="h-3 w-3" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Moderation details card */}
            {listing.moderationStatus !== 'ACTIVE' && (
              <div className="card border border-amber-100 bg-amber-50/30">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <h3 className="font-semibold text-slate-800">{ar ? 'تفاصيل الإشراف' : 'Moderation Details'}</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  <InfoField label={ar ? 'حالة الإشراف' : 'Moderation Status'} value={listing.moderationStatus} />
                  {listing.moderationSource && <InfoField label={ar ? 'المصدر' : 'Source'} value={listing.moderationSource} />}
                  {listing.moderationReason && <InfoField label={ar ? 'السبب' : 'Reason'} value={listing.moderationReason} />}
                  {listing.moderatedAt && <InfoField label={ar ? 'تاريخ الإشراف' : 'Moderated At'} value={fmtDate(listing.moderatedAt)} />}
                </div>
              </div>
            )}

            {/* Images */}
            {listing.images && listing.images.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="h-4 w-4 text-slate-500" />
                  <h3 className="font-semibold text-slate-800">{ar ? 'الصور' : 'Images'}</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {listing.images.map((img) => (
                    <div key={img.id} className={`relative rounded-xl overflow-hidden border-2 ${img.isPrimary ? 'border-brand-400' : 'border-slate-100'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-24 w-24 object-cover" />
                      {img.isPrimary && (
                        <span className="absolute bottom-0 inset-x-0 text-center text-[9px] font-bold bg-brand-600 text-white py-0.5">
                          {ar ? 'رئيسية' : 'Primary'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin actions */}
            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-4">{ar ? 'إجراءات الإشراف' : 'Moderation Actions'}</h3>
              <div className="flex flex-wrap gap-3">
                {listing.moderationStatus !== 'ACTIVE' && (
                  <button
                    onClick={() => doAction('restore')}
                    disabled={!!actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {ar ? 'استعادة' : 'Restore'}
                  </button>
                )}
                {listing.moderationStatus === 'ACTIVE' && (
                  <button
                    onClick={() => doAction('flag')}
                    disabled={!!actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                  >
                    <Flag className="h-4 w-4" />
                    {ar ? 'تعليم للمراجعة' : 'Flag for Review'}
                  </button>
                )}
                {listing.moderationStatus !== 'REMOVED' && !confirmRemove && (
                  <button
                    onClick={() => setConfirmRemove(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    {ar ? 'حذف من المنصة' : 'Remove from Platform'}
                  </button>
                )}
                {confirmRemove && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={removeReason}
                      onChange={(e) => setRemoveReason(e.target.value)}
                      placeholder={ar ? 'سبب الحذف...' : 'Reason for removal…'}
                      className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                    <button
                      onClick={() => doAction('remove', removeReason || undefined)}
                      disabled={!!actionLoading}
                      className="rounded-xl bg-red-600 text-white px-3 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {ar ? 'تأكيد الحذف' : 'Confirm Remove'}
                    </button>
                    <button onClick={() => setConfirmRemove(false)} className="text-sm text-slate-500 hover:text-slate-700">
                      {ar ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
