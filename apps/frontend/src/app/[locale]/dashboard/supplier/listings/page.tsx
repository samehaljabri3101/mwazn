'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Listing } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Package, Plus, Tag, DollarSign, Archive, Eye, EyeOff,
  Camera, X, ExternalLink, Clock, Pencil, Upload,
} from 'lucide-react';

const STATUS_COLORS: Record<string, 'green' | 'amber' | 'gray'> = {
  ACTIVE: 'green', INACTIVE: 'amber', ARCHIVED: 'gray',
};
const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  ACTIVE: { en: 'Active', ar: 'نشط' },
  INACTIVE: { en: 'Inactive', ar: 'غير نشط' },
  ARCHIVED: { en: 'Archived', ar: 'مؤرشف' },
};

export default function SupplierListingsPage() {
  const locale = useLocale();
  const { company } = useAuth();
  const ar = locale === 'ar';

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/listings', { params: { supplierId: company?.id, limit: 50 } });
      setListings(res.data.data?.items || res.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, []);

  const toggleStatus = async (listing: Listing) => {
    const newStatus = listing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setActionLoading(listing.id);
    try {
      await api.patch(`/listings/${listing.id}`, { status: newStatus });
      await fetchListings();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const archiveListing = async (id: string) => {
    setActionLoading(`archive-${id}`);
    try {
      await api.patch(`/listings/${id}`, { status: 'ARCHIVED' });
      await fetchListings();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const openImagePicker = (listingId: string) => {
    setUploadingFor(listingId);
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadingFor || !e.target.files?.length) return;
    const form = new FormData();
    Array.from(e.target.files).forEach((f) => form.append('files', f));
    setActionLoading(`img-${uploadingFor}`);
    try {
      await api.post(`/listings/${uploadingFor}/images`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchListings();
    } catch { /* silent */ }
    setActionLoading(null);
    setUploadingFor(null);
    e.target.value = '';
  };

  const activeListings = listings.filter((l) => l.status !== 'ARCHIVED');
  const archivedListings = listings.filter((l) => l.status === 'ARCHIVED');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{ar ? 'منتجاتي' : 'My Products'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {ar ? `${listings.length} منتج` : `${listings.length} products`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/dashboard/supplier/listings/import`}>
              <Button variant="secondary" icon={<Upload className="h-4 w-4" />}>
                {ar ? 'استيراد بالجملة' : 'Bulk Import'}
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/supplier/listings/new`}>
              <Button icon={<Plus className="h-4 w-4" />}>
                {ar ? 'إضافة منتج' : 'Add Product'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        ) : activeListings.length === 0 ? (
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title={ar ? 'لا توجد منتجات بعد' : 'No listings yet'}
            description={ar ? 'أضف منتجاتك لتظهر في سوق موازن' : 'Add your products to appear in the Mwazn marketplace'}
            action={
              <Link href={`/${locale}/dashboard/supplier/listings/new`}>
                <Button icon={<Plus className="h-4 w-4" />}>{ar ? 'إضافة منتج' : 'Add Product'}</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeListings.map((listing) => (
                <div key={listing.id} className="card flex flex-col gap-3">
                  {/* Image + upload overlay */}
                  <div className="relative aspect-video w-full rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden group">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0].url} alt={listing.titleEn} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-10 w-10 text-slate-300" />
                    )}
                    {/* Upload overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openImagePicker(listing.id)}
                        disabled={actionLoading === `img-${listing.id}`}
                        className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {actionLoading === `img-${listing.id}` ? (ar ? 'جاري...' : 'Uploading...') : (ar ? 'إضافة صورة' : 'Add Image')}
                      </button>
                    </div>
                    {/* Image count badge */}
                    {listing.images && listing.images.length > 1 && (
                      <div className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                        +{listing.images.length}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-800 text-sm line-clamp-2">
                        {ar ? listing.titleAr : listing.titleEn}
                      </h3>
                      <Badge variant={STATUS_COLORS[listing.status]}>
                        {ar ? STATUS_LABELS[listing.status]?.ar : STATUS_LABELS[listing.status]?.en}
                      </Badge>
                    </div>

                    {listing.category && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Tag className="h-3 w-3" />
                        {ar ? listing.category.nameAr : listing.category.nameEn}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      {listing.price && (
                        <p className="text-sm font-bold text-brand-700 flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {listing.price.toLocaleString()} SAR
                          {listing.unit && <span className="text-xs text-slate-400 font-normal">/ {listing.unit}</span>}
                        </p>
                      )}
                      {listing.leadTimeDays && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {listing.leadTimeDays}d
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    {listing.tags && listing.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {listing.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    {/* View public page */}
                    <Link
                      href={`/${locale}/products/${listing.slug || listing.id}`}
                      target="_blank"
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                    <Link href={`/${locale}/dashboard/supplier/listings/${listing.id}/edit`}>
                      <Button size="sm" variant="ghost" icon={<Pencil className="h-3.5 w-3.5" />}>
                        {ar ? 'تعديل' : 'Edit'}
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={listing.status === 'ACTIVE' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      loading={actionLoading === listing.id}
                      onClick={() => toggleStatus(listing)}
                      className="flex-1"
                    >
                      {listing.status === 'ACTIVE' ? (ar ? 'إيقاف' : 'Deactivate') : (ar ? 'تفعيل' : 'Activate')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Archive className="h-3.5 w-3.5" />}
                      loading={actionLoading === `archive-${listing.id}`}
                      onClick={() => archiveListing(listing.id)}
                    >
                      {ar ? 'أرشفة' : 'Archive'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {archivedListings.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 mb-3">{ar ? 'المؤرشفة' : 'Archived'}</h3>
                <div className="space-y-2">
                  {archivedListings.map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
                      <p className="text-sm text-slate-500">{ar ? listing.titleAr : listing.titleEn}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={actionLoading === listing.id}
                        onClick={() => toggleStatus(listing)}
                      >
                        {ar ? 'استعادة' : 'Restore'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
