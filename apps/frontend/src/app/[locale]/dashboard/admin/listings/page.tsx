'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Package, Search, Flag, Trash2, RotateCcw, RefreshCw, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

interface AdminListing {
  id: string;
  titleEn: string;
  titleAr: string;
  status: string;
  moderationStatus: string;
  moderationReason?: string;
  price?: number;
  currency: string;
  createdAt: string;
  supplier?: { id: string; nameAr: string; nameEn: string };
  category?: { nameAr: string; nameEn: string };
}

const MOD_STATUS_META: Record<string, { bg: string; text: string; labelEn: string }> = {
  ACTIVE:   { bg: 'bg-green-100',  text: 'text-green-700',  labelEn: 'Active' },
  FLAGGED:  { bg: 'bg-amber-100',  text: 'text-amber-700',  labelEn: 'Flagged' },
  REMOVED:  { bg: 'bg-red-100',    text: 'text-red-700',    labelEn: 'Removed' },
  REJECTED: { bg: 'bg-rose-100',   text: 'text-rose-700',   labelEn: 'Rejected' },
};

function ModerationBadge({ status }: { status: string }) {
  const m = MOD_STATUS_META[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', labelEn: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.bg} ${m.text}`}>
      {m.labelEn}
    </span>
  );
}

export default function AdminListingsPage() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;

  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modFilter, setModFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/listings', {
        params: { limit: 50, search: search || undefined, moderationStatus: modFilter || undefined },
      });
      setListings(res.data.data?.items ?? res.data.data ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [search, modFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const doAction = async (id: string, action: 'remove' | 'restore' | 'flag', reason?: string) => {
    setActionLoading(`${id}-${action}`);
    try {
      await api.patch(`/admin/listings/${id}/${action}`, reason ? { reason } : {});
      await fetch();
    } catch { /* silent */ }
    setActionLoading(null);
    setConfirmRemove(null);
    setReasonInput('');
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Package className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{ar ? 'جميع المنتجات' : 'All Listings'}</h1>
          </div>
          <p className="text-sm text-slate-500 ms-12">{ar ? 'إدارة منتجات جميع الموردين' : 'Manage listings across all suppliers'}</p>
        </div>

        {/* Search + Filter + Refresh */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? 'ابحث...' : 'Search listings...'}
              className="w-full ps-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <select
            value={modFilter}
            onChange={(e) => setModFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          >
            <option value="">{ar ? 'كل حالات الإشراف' : 'All moderation'}</option>
            <option value="ACTIVE">{ar ? 'نشط' : 'Active'}</option>
            <option value="FLAGGED">{ar ? 'مُعلَّم' : 'Flagged'}</option>
            <option value="REMOVED">{ar ? 'محذوف' : 'Removed'}</option>
            <option value="REJECTED">{ar ? 'مرفوض' : 'Rejected'}</option>
          </select>
          <button onClick={fetch} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : listings.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">{ar ? 'لا توجد منتجات' : 'No listings found'}</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-start px-4 py-3 font-medium text-slate-500">{ar ? 'المنتج' : 'Product'}</th>
                  <th className="text-start px-4 py-3 font-medium text-slate-500">{ar ? 'المورد' : 'Supplier'}</th>
                  <th className="text-start px-4 py-3 font-medium text-slate-500">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="text-start px-4 py-3 font-medium text-slate-500">{ar ? 'الإشراف' : 'Moderation'}</th>
                  <th className="text-start px-4 py-3 font-medium text-slate-500">{ar ? 'السعر' : 'Price'}</th>
                  <th className="text-end px-4 py-3 font-medium text-slate-500">{ar ? 'إجراءات' : 'Actions'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 truncate max-w-[200px]">
                        {ar ? listing.titleAr : listing.titleEn}
                      </p>
                      <p className="text-xs text-slate-400">{listing.category ? (ar ? listing.category.nameAr : listing.category.nameEn) : '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {listing.supplier ? (ar ? listing.supplier.nameAr : listing.supplier.nameEn) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${listing.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ModerationBadge status={listing.moderationStatus} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {listing.price ? `${listing.price.toLocaleString()} ${listing.currency}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`${base}/admin/listings/${listing.id}`}
                        className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {ar ? 'عرض' : 'View'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {listing.moderationStatus !== 'ACTIVE' && (
                          <button
                            onClick={() => doAction(listing.id, 'restore')}
                            disabled={!!actionLoading}
                            className="p-1 rounded text-green-600 hover:bg-green-50 disabled:opacity-50"
                            title="Restore"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {listing.moderationStatus === 'ACTIVE' && (
                          <button
                            onClick={() => doAction(listing.id, 'flag')}
                            disabled={!!actionLoading}
                            className="p-1 rounded text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                            title="Flag"
                          >
                            <Flag className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {listing.moderationStatus !== 'REMOVED' && (
                          confirmRemove === listing.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="Reason..."
                                value={reasonInput}
                                onChange={(e) => setReasonInput(e.target.value)}
                                className="text-xs border border-slate-200 rounded px-1 py-0.5 w-24"
                              />
                              <button onClick={() => doAction(listing.id, 'remove', reasonInput || undefined)} className="px-1.5 py-0.5 rounded text-xs bg-red-600 text-white">✓</button>
                              <button onClick={() => { setConfirmRemove(null); setReasonInput(''); }} className="px-1 py-0.5 text-slate-500">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRemove(listing.id)}
                              className="p-1 rounded text-red-600 hover:bg-red-50"
                              title="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
