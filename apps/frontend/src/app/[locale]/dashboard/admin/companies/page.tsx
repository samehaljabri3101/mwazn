'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Company } from '@/types';
import {
  Search, Building2, CheckCircle2, XCircle, Zap, ChevronDown, ChevronRight,
  ExternalLink, FileText, Shield, Clock, Eye,
} from 'lucide-react';

interface VerificationDoc {
  id: string;
  type: string;
  fileUrl: string;
  uploadedAt: string;
  decision: string | null;
  notes: string | null;
}

interface CompanyWithDocs extends Company {
  verificationDocs?: VerificationDoc[];
  verifiedAt?: string;
  verificationNotes?: string;
  slug?: string;
}

const PLAN_COLORS = { FREE: 'gray' as const, PRO: 'blue' as const };
const VERIFY_COLORS = { VERIFIED: 'green' as const, PENDING: 'amber' as const, REJECTED: 'red' as const };

const DOC_TYPE_LABEL: Record<string, { en: string; ar: string }> = {
  CR: { en: 'Commercial Registration', ar: 'السجل التجاري' },
  VAT: { en: 'VAT Certificate', ar: 'شهادة ضريبة القيمة المضافة' },
  LICENSE: { en: 'Business License', ar: 'رخصة تجارية' },
  ISO: { en: 'ISO Certificate', ar: 'شهادة ISO' },
  OTHER: { en: 'Other Document', ar: 'وثيقة أخرى' },
};

export default function AdminCompaniesPage() {
  const locale = useLocale();
  const ar = locale === 'ar';

  const [companies, setCompanies] = useState<CompanyWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/companies', {
        params: {
          search: search || undefined,
          type: typeFilter || undefined,
          status: statusFilter || undefined,
          limit: 200,
        },
      });
      const list: CompanyWithDocs[] = res.data.data?.items || res.data.data || [];
      setCompanies(list);
      const notes: Record<string, string> = {};
      list.forEach((c) => { if (c.adminNotes) notes[c.id] = c.adminNotes; });
      setAdminNotes((prev) => ({ ...notes, ...prev }));
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, [search, typeFilter, statusFilter]);

  const approve = async (companyId: string) => {
    setActionLoading(`approve-${companyId}`);
    try {
      await api.patch(`/verification/admin/${companyId}/approve`, {
        notes: adminNotes[companyId] || undefined,
      });
      await fetchCompanies();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const reject = async (companyId: string) => {
    const notes = rejectNotes[companyId] || '';
    setActionLoading(`reject-${companyId}`);
    try {
      await api.patch(`/verification/admin/${companyId}/reject`, { notes });
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

  const saveNotes = async (companyId: string) => {
    setActionLoading(`notes-${companyId}`);
    try {
      await api.patch(`/companies/${companyId}/verify`, {
        status: companies.find((c) => c.id === companyId)?.verificationStatus,
        adminNotes: adminNotes[companyId],
      });
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const pendingCount = companies.filter((c) => c.verificationStatus === 'PENDING').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{ar ? 'إدارة الشركات' : 'Manage Companies'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {ar ? `${companies.length} شركة` : `${companies.length} companies`}
              {pendingCount > 0 && (
                <span className="ms-2 inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                  {pendingCount} {ar ? 'بانتظار التوثيق' : 'pending verification'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? 'بحث باسم الشركة أو رقم السجل...' : 'Search by name or CR number...'}
              className="input-base ps-9"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-base sm:w-40">
            <option value="">{ar ? 'جميع الأنواع' : 'All Types'}</option>
            <option value="BUYER">{ar ? 'مشترون' : 'Buyers'}</option>
            <option value="SUPPLIER">{ar ? 'موردون' : 'Suppliers'}</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base sm:w-44">
            <option value="">{ar ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="PENDING">{ar ? 'بانتظار التوثيق' : 'Pending'}</option>
            <option value="VERIFIED">{ar ? 'موثق' : 'Verified'}</option>
            <option value="REJECTED">{ar ? 'مرفوض' : 'Rejected'}</option>
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
                    <th className="text-start px-3 py-3 text-xs font-semibold text-slate-500 w-6" />
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500">{ar ? 'الشركة' : 'Company'}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500">{ar ? 'النوع' : 'Type'}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500">{ar ? 'التوثيق' : 'Verification'}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500">{ar ? 'الخطة' : 'Plan'}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500">{ar ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {companies.map((company) => (
                    <>
                      <tr
                        key={company.id}
                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${company.verificationStatus === 'PENDING' ? 'bg-amber-50/30' : ''}`}
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
                              <p className="font-medium text-slate-800 truncate">{ar ? company.nameAr : company.nameEn}</p>
                              <p className="text-xs text-slate-400 font-mono">CR: {company.crNumber}</p>
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
                          <Badge variant={PLAN_COLORS[company.plan]}>{company.plan}</Badge>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {company.type === 'SUPPLIER' && (
                              <Link
                                href={`/${locale}/suppliers/${company.slug || company.id}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <Eye className="h-3 w-3" />
                                {ar ? 'العرض' : 'View'}
                              </Link>
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
                        <tr key={`${company.id}-detail`}>
                          <td colSpan={6} className="bg-slate-50/70 border-b border-slate-100">
                            <div className="px-6 py-5 space-y-5">

                              {/* CR & Legal Details */}
                              <div>
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                  {ar ? 'معلومات السجل التجاري والقانونية' : 'CR & Legal Information'}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                  <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                                    <p className="text-xs text-slate-500 mb-0.5">{ar ? 'رقم السجل التجاري' : 'CR Number'}</p>
                                    <p className="font-semibold text-slate-800 font-mono">{company.crNumber}</p>
                                  </div>
                                  {company.vatNumber && (
                                    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                                      <p className="text-xs text-slate-500 mb-0.5">{ar ? 'الرقم الضريبي' : 'VAT Number'}</p>
                                      <p className="font-semibold text-slate-800 font-mono text-xs">{company.vatNumber}</p>
                                    </div>
                                  )}
                                  {company.crExpiryDate && (
                                    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                                      <p className="text-xs text-slate-500 mb-0.5">{ar ? 'انتهاء السجل' : 'CR Expiry'}</p>
                                      <p className={`font-semibold text-sm ${new Date(company.crExpiryDate) < new Date() ? 'text-red-600' : 'text-slate-800'}`}>
                                        {formatDate(company.crExpiryDate)}
                                      </p>
                                    </div>
                                  )}
                                  <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                                    <p className="text-xs text-slate-500 mb-0.5">{ar ? 'المدينة' : 'City'}</p>
                                    <p className="font-semibold text-slate-800">{company.city || '—'}</p>
                                  </div>
                                  {company.legalForm && (
                                    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                                      <p className="text-xs text-slate-500 mb-0.5">{ar ? 'الشكل القانوني' : 'Legal Form'}</p>
                                      <p className="font-semibold text-slate-800">{company.legalForm}</p>
                                    </div>
                                  )}
                                  {company.establishmentYear && (
                                    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                                      <p className="text-xs text-slate-500 mb-0.5">{ar ? 'سنة التأسيس' : 'Est. Year'}</p>
                                      <p className="font-semibold text-slate-800">{company.establishmentYear}</p>
                                    </div>
                                  )}
                                  {company.companySizeRange && (
                                    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                                      <p className="text-xs text-slate-500 mb-0.5">{ar ? 'حجم الشركة' : 'Company Size'}</p>
                                      <p className="font-semibold text-slate-800">{company.companySizeRange}</p>
                                    </div>
                                  )}
                                  {company.phone && (
                                    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                                      <p className="text-xs text-slate-500 mb-0.5">{ar ? 'الهاتف' : 'Phone'}</p>
                                      <p className="font-semibold text-slate-800">{company.phone}</p>
                                    </div>
                                  )}
                                  <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                                    <p className="text-xs text-slate-500 mb-0.5">{ar ? 'تاريخ التسجيل' : 'Registered'}</p>
                                    <p className="font-semibold text-slate-800">{formatDate(company.createdAt)}</p>
                                  </div>
                                  {(company as any).verifiedAt && (
                                    <div className="rounded-xl bg-white border border-green-100 bg-green-50 px-3 py-2.5">
                                      <p className="text-xs text-green-600 mb-0.5">{ar ? 'تاريخ التوثيق' : 'Verified On'}</p>
                                      <p className="font-semibold text-green-800">{formatDate((company as any).verifiedAt)}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Sectors */}
                                {company.sectors && company.sectors.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-xs text-slate-500 mb-1.5">{ar ? 'القطاعات' : 'Sectors'}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {company.sectors.map((s) => (
                                        <span key={s} className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs text-slate-600">{s}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Verification Documents */}
                              {company.type === 'SUPPLIER' && (
                                <div>
                                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5" />
                                    {ar ? 'وثائق التحقق المرفوعة' : 'Uploaded Verification Documents'}
                                  </h3>
                                  {!company.verificationDocs || company.verificationDocs.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-center">
                                      <p className="text-xs text-slate-400">
                                        {ar ? 'لم يرفع المورد أي وثائق بعد' : 'No documents uploaded by this supplier yet'}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {company.verificationDocs.map((doc) => (
                                        <a
                                          key={doc.id}
                                          href={`http://localhost:3001${doc.fileUrl}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-brand-300 hover:bg-brand-50/40 transition-all group"
                                        >
                                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                                            <FileText className="h-4 w-4" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700">
                                              {ar
                                                ? DOC_TYPE_LABEL[doc.type]?.ar || doc.type
                                                : DOC_TYPE_LABEL[doc.type]?.en || doc.type}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(doc.uploadedAt)}</p>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {doc.decision === 'APPROVED' && (
                                              <span className="rounded-full bg-green-100 text-green-700 text-[10px] px-2 py-0.5 font-medium">
                                                {ar ? 'مقبول' : 'Approved'}
                                              </span>
                                            )}
                                            {doc.decision === 'REJECTED' && (
                                              <span className="rounded-full bg-red-100 text-red-700 text-[10px] px-2 py-0.5 font-medium">
                                                {ar ? 'مرفوض' : 'Rejected'}
                                              </span>
                                            )}
                                            {!doc.decision && (
                                              <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 font-medium">
                                                {ar ? 'معلق' : 'Pending'}
                                              </span>
                                            )}
                                            <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-600" />
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Verification Action */}
                              {company.type === 'SUPPLIER' && (
                                <div className={`rounded-xl border p-4 ${
                                  company.verificationStatus === 'PENDING'
                                    ? 'border-amber-200 bg-amber-50'
                                    : company.verificationStatus === 'VERIFIED'
                                    ? 'border-green-200 bg-green-50'
                                    : 'border-red-200 bg-red-50'
                                }`}>
                                  <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        {company.verificationStatus === 'VERIFIED'
                                          ? <Shield className="h-4 w-4 text-green-600" />
                                          : company.verificationStatus === 'PENDING'
                                          ? <Clock className="h-4 w-4 text-amber-600" />
                                          : <XCircle className="h-4 w-4 text-red-600" />}
                                        <span className={`text-sm font-semibold ${
                                          company.verificationStatus === 'VERIFIED' ? 'text-green-800'
                                            : company.verificationStatus === 'PENDING' ? 'text-amber-800'
                                            : 'text-red-800'
                                        }`}>
                                          {company.verificationStatus === 'VERIFIED'
                                            ? (ar ? 'الحساب موثق' : 'Account Verified')
                                            : company.verificationStatus === 'PENDING'
                                            ? (ar ? 'بانتظار مراجعة التوثيق' : 'Pending Verification Review')
                                            : (ar ? 'الحساب مرفوض' : 'Account Rejected')}
                                        </span>
                                      </div>
                                      {(company as any).verificationNotes && (
                                        <p className="text-xs text-slate-600 mt-1">
                                          {ar ? 'ملاحظة:' : 'Note:'} {(company as any).verificationNotes}
                                        </p>
                                      )}
                                    </div>

                                    {company.verificationStatus === 'PENDING' && (
                                      <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-sm">
                                        <textarea
                                          value={rejectNotes[company.id] || ''}
                                          onChange={(e) => setRejectNotes((prev) => ({ ...prev, [company.id]: e.target.value }))}
                                          rows={2}
                                          className="input-base w-full text-sm resize-none"
                                          placeholder={ar ? 'ملاحظة (مطلوبة للرفض، اختيارية للقبول)...' : 'Note (required for rejection, optional for approval)...'}
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                                            loading={actionLoading === `approve-${company.id}`}
                                            onClick={() => approve(company.id)}
                                            className="flex-1"
                                          >
                                            {ar ? 'قبول وتوثيق' : 'Approve & Verify'}
                                          </Button>
                                          <Button
                                            variant="danger"
                                            icon={<XCircle className="h-3.5 w-3.5" />}
                                            loading={actionLoading === `reject-${company.id}`}
                                            onClick={() => reject(company.id)}
                                            className="flex-1"
                                          >
                                            {ar ? 'رفض' : 'Reject'}
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    {company.verificationStatus === 'VERIFIED' && (
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        icon={<XCircle className="h-3.5 w-3.5" />}
                                        loading={actionLoading === `reject-${company.id}`}
                                        onClick={() => reject(company.id)}
                                      >
                                        {ar ? 'إلغاء التوثيق' : 'Revoke Verification'}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Admin Notes */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                  {ar ? 'ملاحظات إدارية (داخلية)' : 'Admin Notes (internal only)'}
                                </label>
                                <div className="flex gap-2">
                                  <textarea
                                    value={adminNotes[company.id] || ''}
                                    onChange={(e) => setAdminNotes((prev) => ({ ...prev, [company.id]: e.target.value }))}
                                    rows={2}
                                    className="input-base flex-1 text-sm resize-none"
                                    placeholder={ar ? 'أضف ملاحظات داخلية عن هذه الشركة...' : 'Add internal notes about this company...'}
                                  />
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    loading={actionLoading === `notes-${company.id}`}
                                    onClick={() => saveNotes(company.id)}
                                  >
                                    {ar ? 'حفظ' : 'Save'}
                                  </Button>
                                </div>
                              </div>
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
