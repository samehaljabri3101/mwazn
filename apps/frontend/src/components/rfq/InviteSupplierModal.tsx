'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import api from '@/lib/api';
import { X, Search, CheckCircle2, UserPlus } from 'lucide-react';

interface Supplier {
  id: string;
  nameAr: string;
  nameEn: string;
  city?: string;
  plan: string;
  verificationStatus: string;
  logoUrl?: string;
}

interface Props {
  rfqId: string;
  onClose: () => void;
}

export function InviteSupplierModal({ rfqId, onClose }: Props) {
  const locale = useLocale();
  const ar = locale === 'ar';

  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [inviting, setInviting] = useState<string | null>(null);

  // Load already-invited suppliers
  useEffect(() => {
    api.get(`/rfqs/${rfqId}/invites`)
      .then((res) => {
        const data = res.data.data || [];
        setInvited(new Set(data.map((inv: any) => inv.supplierId)));
      })
      .catch(() => {});
  }, [rfqId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 1 || search === '') {
        searchSuppliers(search);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const searchSuppliers = async (q: string) => {
    setLoading(true);
    try {
      const res = await api.get('/companies', {
        params: { type: 'SUPPLIER', search: q || undefined, verificationStatus: 'VERIFIED', limit: 20 },
      });
      setSuppliers(res.data.data?.items || res.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleInvite = async (supplierId: string) => {
    setInviting(supplierId);
    try {
      await api.post(`/rfqs/${rfqId}/invites`, { supplierId });
      setInvited((prev) => {
  const next = new Set(prev);
  next.add(supplierId);
  return next;
});
    } catch { /* silent */ }
    setInviting(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-lift overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">
            {ar ? 'دعوة الموردين' : 'Invite Suppliers'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rtl:left-auto rtl:right-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? 'ابحث عن مورد موثّق...' : 'Search verified suppliers...'}
              className="input-base w-full pl-9 rtl:pl-3 rtl:pr-9 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">
              {ar ? 'لا توجد نتائج' : 'No suppliers found'}
            </div>
          ) : (
            <div className="space-y-2">
              {suppliers.map((s) => {
                const isInvited = invited.has(s.id);
                const isLoading = inviting === s.id;
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 hover:border-brand-100 hover:bg-brand-50/30 transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 font-bold text-sm">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        (ar ? s.nameAr : s.nameEn).charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {ar ? s.nameAr : s.nameEn}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {s.city && <span className="text-[10px] text-slate-400">{s.city}</span>}
                        {s.plan === 'PRO' && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">PRO</span>
                        )}
                        <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] text-green-700">
                          {ar ? 'موثّق' : 'Verified'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => !isInvited && handleInvite(s.id)}
                      disabled={isInvited || isLoading}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        isInvited
                          ? 'bg-green-50 text-green-700 cursor-default'
                          : 'bg-brand-700 text-white hover:bg-brand-800 disabled:opacity-60'
                      }`}
                    >
                      {isLoading ? (
                        <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                      ) : isInvited ? (
                        <><CheckCircle2 className="h-3 w-3" /> {ar ? 'تمت الدعوة' : 'Invited'}</>
                      ) : (
                        <><UserPlus className="h-3 w-3" /> {ar ? 'دعوة' : 'Invite'}</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
