'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import { type CompanyWithDocs } from '../_utils';
import { CompanyDetail, CompanyDetailEmpty } from '../CompanyDetail';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCompanyDetailPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;

  const [company, setCompany] = useState<CompanyWithDocs | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies/${params.id}`);
      const data: CompanyWithDocs = res.data?.data ?? res.data;
      setCompany(data);
      if ((data as any)?.adminNotes) setNotes((data as any).adminNotes);
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  const handleApprove = async (id: string, note?: string) => {
    setActionLoading(`approve-${id}`);
    try {
      await api.patch(`/verification/admin/${id}/approve`, { notes: note || undefined });
      await fetchCompany();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const handleReject = async (id: string, note: string) => {
    setActionLoading(`reject-${id}`);
    try {
      await api.patch(`/verification/admin/${id}/reject`, { notes: note });
      await fetchCompany();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const handleUpdatePlan = async (id: string, plan: 'FREE' | 'PRO') => {
    setActionLoading(`plan-${id}`);
    try {
      await api.patch(`/companies/${id}`, { plan });
      await fetchCompany();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const handleSaveNotes = async (id: string, adminNotes: string) => {
    setActionLoading(`notes-${id}`);
    try {
      await api.patch(`/companies/${id}`, { adminNotes });
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const companyName = company ? (ar ? company.nameAr : company.nameEn) : null;

  return (
    <DashboardLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`${base}/admin/companies`} className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-xs font-bold">
              {companyName?.charAt(0).toUpperCase() ?? <Building2 className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 truncate">
                {loading ? (ar ? 'جارٍ التحميل...' : 'Loading…') : (companyName ?? (ar ? 'الشركة غير موجودة' : 'Company not found'))}
              </h1>
              <p className="text-xs text-slate-400">{ar ? 'ملف الشركة الكامل' : 'Full company profile'}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : notFound || !company ? (
          <div className="space-y-4">
            <CompanyDetailEmpty ar={ar} />
            <div className="text-center">
              <Link href={`${base}/admin/companies`} className="text-sm text-brand-600 hover:underline">
                {ar ? '← العودة إلى قائمة الشركات' : '← Back to company list'}
              </Link>
            </div>
          </div>
        ) : (
          <CompanyDetail
            company={company}
            locale={locale}
            actionLoading={actionLoading}
            notes={notes}
            onNotesChange={setNotes}
            onApprove={handleApprove}
            onReject={handleReject}
            onUpdatePlan={handleUpdatePlan}
            onSaveNotes={handleSaveNotes}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
