'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Company } from '@/types';
import { Search, Building2, CheckCircle2, XCircle, Zap, ChevronDown, ChevronRight } from 'lucide-react';

const PLAN_COLORS = { FREE: 'gray' as const, PRO: 'blue' as const };
const VERIFY_COLORS = { VERIFIED: 'green' as const, PENDING: 'amber' as const, REJECTED: 'red' as const };

export default function AdminCompaniesPage() {
  const locale = useLocale();
  const ar = locale === 'ar';

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/companies', {
        params: {
          search: search || undefined,
          type: typeFilter || undefined,
          limit: 100,
        },
      });
      const list: Company[] = res.data.data?.items || res.data.data || [];
      setCompanies(list);
      // Pre-fill admin notes from fetched data
      const notes: Record<string, string> = {};
      list.forEach((c) => { if (c.adminNotes) notes[c.id] = c.adminNotes; });
      setAdminNotes((prev) => ({ ...notes, ...prev }));
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, [search, typeFilter]);

  const updateVerification = async (companyId: string, status: 'VERIFIED' | 'REJECTED') => {
    setActionLoading(`${status}-${companyId}`);
    try {
      await api.patch(`/companies/${companyId}/verify`, {
        status,
        adminNotes: adminNotes[companyId] || undefined,
      });
      await fetchCompanies();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const updatePlan = async (companyId: string, plan: 'FREE' | 'PRO') => {
    setActionLoading(`plan-${companyId}`);
    try {
      await api.patch(`/admin/companies/${companyId}/plan`, { plan });
      await fetchCompanies();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{ar ? 'إدارة الشركات' : 'Manage Companies'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {ar ? `${companies.length} شركة` : `${companies.length} companies`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? 'بحث باسم الشركة أو CR...' : 'Search by name or CR...'}
              className="input-base ps-9"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-base sm:w-44"
          >
            <option value="">{ar ? 'جميع الأنواع' : 'All Types'}</option>
            <option value="BUYER">{ar ? 'مشترون' : 'Buyers'}</option>
            <option value="SUPPLIER">{ar ? 'موردون' : 'Suppliers'}</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 w-6" />
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500">
                      {ar ? 'الشركة' : 'Company'}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500">
                      {ar ? 'النوع' : 'Type'}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500">
                      {ar ? 'التوثيق' : 'Verification'}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500">
                      {ar ? 'الخطة' : 'Plan'}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500">
                      {ar ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {companies.map((company) => (
                    <>
                      <tr
                        key={company.id}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === company.id ? null : company.id)}
                      >
                        <td className="px-3 py-3 text-slate-400">
                          {expandedId === company.id
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 font-bold text-sm shrink-0">
                              {(company.nameEn || company.nameAr).charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 truncate">
                                {ar ? company.nameAr : company.nameEn}
                              </p>
                              <p className="text-xs text-slate-400">CR: {company.crNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Badge variant={company.type === 'BUYER' ? 'blue' : 'green'}>
                            {company.type === 'BUYER' ? (ar ? 'مشترٍ' : 'Buyer') : (ar ? 'مورّد' : 'Supplier')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Badge variant={VERIFY_COLORS[company.verificationStatus]}>
                            {company.verificationStatus === 'VERIFIED' ? (ar ? 'موثق' : 'Verified')
                              : company.verificationStatus === 'PENDING' ? (ar ? 'معلق' : 'Pending')
                              : (ar ? 'مرفوض' : 'Rejected')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Badge variant={PLAN_COLORS[company.plan]}>
                            {company.plan}
                          </Badge>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            {company.verificationStatus === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  icon={<CheckCircle2 className="h-3 w-3" />}
                                  loading={actionLoading === `VERIFIED-${company.id}`}
                                  onClick={() => updateVerification(company.id, 'VERIFIED')}
                                >
                                  {ar ? 'توثيق' : 'Verify'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  icon={<XCircle className="h-3 w-3" />}
                                  loading={actionLoading === `REJECTED-${company.id}`}
                                  onClick={() => updateVerification(company.id, 'REJECTED')}
                                >
                                  {ar ? 'رفض' : 'Reject'}
                                </Button>
                              </>
                            )}
                            {company.plan === 'FREE' && company.type === 'SUPPLIER' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={<Zap className="h-3 w-3" />}
                                loading={actionLoading === `plan-${company.id}`}
                                onClick={() => updatePlan(company.id, 'PRO')}
                              >
                                PRO
                              </Button>
                            )}
                            {company.plan === 'PRO' && company.type === 'SUPPLIER' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                loading={actionLoading === `plan-${company.id}`}
                                onClick={() => updatePlan(company.id, 'FREE')}
                              >
                                {ar ? 'خفض' : 'Downgrade'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {expandedId === company.id && (
                        <tr key={`${company.id}-detail`} className="bg-slate-50/70">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                              <div>
                                <p className="text-xs text-slate-500 mb-0.5">{ar ? 'المدينة' : 'City'}</p>
                                <p className="font-medium text-slate-800">{company.city || '—'}</p>
                              </div>
                              {company.vatNumber && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">{ar ? 'الرقم الضريبي' : 'VAT Number'}</p>
                                  <p className="font-medium text-slate-800 font-mono text-xs">{company.vatNumber}</p>
                                </div>
                              )}
                              {company.crExpiryDate && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">{ar ? 'انتهاء السجل' : 'CR Expiry'}</p>
                                  <p className="font-medium text-slate-800">{formatDate(company.crExpiryDate)}</p>
                                </div>
                              )}
                              {company.planExpiresAt && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">{ar ? 'انتهاء الخطة' : 'Plan Expires'}</p>
                                  <p className="font-medium text-slate-800">{formatDate(company.planExpiresAt)}</p>
                                </div>
                              )}
                              {company.legalForm && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">{ar ? 'الشكل القانوني' : 'Legal Form'}</p>
                                  <p className="font-medium text-slate-800">{company.legalForm}</p>
                                </div>
                              )}
                              {company.establishmentYear && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">{ar ? 'سنة التأسيس' : 'Est. Year'}</p>
                                  <p className="font-medium text-slate-800">{company.establishmentYear}</p>
                                </div>
                              )}
                              {company.companySizeRange && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">{ar ? 'حجم الشركة' : 'Company Size'}</p>
                                  <p className="font-medium text-slate-800">{company.companySizeRange}</p>
                                </div>
                              )}
                              {company.contactJobTitle && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">{ar ? 'المسمى الوظيفي' : 'Job Title'}</p>
                                  <p className="font-medium text-slate-800">{company.contactJobTitle}</p>
                                </div>
                              )}
                              {company.phone && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-0.5">{ar ? 'الهاتف' : 'Phone'}</p>
                                  <p className="font-medium text-slate-800">{company.phone}</p>
                                </div>
                              )}
                              {company.sectors && company.sectors.length > 0 && (
                                <div className="col-span-2">
                                  <p className="text-xs text-slate-500 mb-0.5">{ar ? 'القطاعات' : 'Sectors'}</p>
                                  <div className="flex flex-wrap gap-1">
                                    {company.sectors.map((s) => (
                                      <span key={s} className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Admin Notes */}
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                {ar ? 'ملاحظات الإدارة (داخلية)' : 'Admin Notes (internal)'}
                              </label>
                              <textarea
                                value={adminNotes[company.id] || ''}
                                onChange={(e) => setAdminNotes((prev) => ({ ...prev, [company.id]: e.target.value }))}
                                rows={2}
                                className="input-base w-full text-sm resize-none"
                                placeholder={ar ? 'أضف ملاحظات داخلية عن هذه الشركة...' : 'Add internal notes about this company...'}
                              />
                              {company.adminNotes && adminNotes[company.id] !== company.adminNotes && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {ar ? 'الملاحظة الحالية:' : 'Current:'} {company.adminNotes}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
              {companies.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">{ar ? 'لا توجد شركات' : 'No companies found'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
