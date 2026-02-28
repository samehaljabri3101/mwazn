'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Building2, FileText, Briefcase, Users, CheckCircle2, XCircle, Clock,
  Star, Package, MessageSquare, TrendingUp, ShieldCheck, Zap,
} from 'lucide-react';

interface DashboardData {
  companies: {
    total: number; buyers: number; suppliers: number;
    verified: number; pending: number; pro: number;
  };
  rfqs: { total: number; open: number };
  quotes: { total: number };
  deals: { total: number; active: number; completed: number };
  listings: { active: number };
  ratings: { total: number };
  recentActivity: Array<{
    id: string; action: string; entity: string; entityId?: string;
    createdAt: string;
    user?: { fullName: string; email: string };
  }>;
}

interface PendingSupplier {
  id: string;
  nameAr: string;
  nameEn: string;
  crNumber: string;
  city: string;
  createdAt: string;
}

function StatCard({ icon, label, value, sub, color = 'brand', href }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string; href?: string;
}) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  const inner = (
    <div className="card hover:shadow-card-hover transition-shadow">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${colors[color] || colors.brand}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminDashboardPage() {
  const locale = useLocale();
  const ar = locale === 'ar';

  const [data, setData] = useState<DashboardData | null>(null);
  const [pending, setPending] = useState<PendingSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const base = `/${locale}/dashboard`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/pending-verifications'),
      ]);
      setData(statsRes.data.data);
      setPending(pendingRes.data.data?.items || pendingRes.data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const verify = async (companyId: string, action: 'verify' | 'reject') => {
    setActionLoading(`${action}-${companyId}`);
    try {
      await api.patch(`/companies/${companyId}/verify`, {
        status: action === 'verify' ? 'VERIFIED' : 'REJECTED',
      });
      await fetchData();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{ar ? 'لوحة الإدارة' : 'Admin Dashboard'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{ar ? 'نظرة عامة على منصة موازن' : 'Platform overview & management'}</p>
          </div>
          <Link href={`${base}/admin/companies`}>
            <Button size="sm" variant="secondary" icon={<Users className="h-4 w-4" />}>
              {ar ? 'إدارة الشركات' : 'Manage Companies'}
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          </div>
        ) : data ? (
          <>
            {/* Company stats */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 mb-3">{ar ? 'الشركات' : 'Companies'}</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<Building2 className="h-5 w-5" />}
                  label={ar ? 'إجمالي الشركات' : 'Total Companies'}
                  value={data.companies.total}
                  sub={ar ? `${data.companies.buyers} مشترٍ · ${data.companies.suppliers} مورّد` : `${data.companies.buyers} buyers · ${data.companies.suppliers} suppliers`}
                  color="brand"
                  href={`${base}/admin/companies`}
                />
                <StatCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  label={ar ? 'موردون موثقون' : 'Verified Suppliers'}
                  value={data.companies.verified}
                  color="green"
                />
                <StatCard
                  icon={<Clock className="h-5 w-5" />}
                  label={ar ? 'موردون معلقون' : 'Pending Suppliers'}
                  value={data.companies.pending}
                  color="amber"
                />
                <StatCard
                  icon={<Zap className="h-5 w-5" />}
                  label={ar ? 'موردو PRO' : 'PRO Suppliers'}
                  value={data.companies.pro}
                  color="purple"
                />
              </div>
            </div>

            {/* Activity stats */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 mb-3">{ar ? 'النشاط' : 'Activity'}</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<FileText className="h-5 w-5" />}
                  label={ar ? 'طلبات الأسعار' : 'Total RFQs'}
                  value={data.rfqs.total}
                  sub={ar ? `${data.rfqs.open} مفتوح` : `${data.rfqs.open} open`}
                  color="brand"
                />
                <StatCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  label={ar ? 'عروض الأسعار' : 'Total Quotes'}
                  value={data.quotes.total}
                  color="blue"
                />
                <StatCard
                  icon={<Briefcase className="h-5 w-5" />}
                  label={ar ? 'الصفقات' : 'Deals'}
                  value={data.deals.total}
                  sub={ar ? `${data.deals.completed} مكتملة` : `${data.deals.completed} completed`}
                  color="green"
                />
                <StatCard
                  icon={<Star className="h-5 w-5" />}
                  label={ar ? 'التقييمات' : 'Ratings'}
                  value={data.ratings.total}
                  color="amber"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending verifications */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-800">
                    {ar ? 'موردون بانتظار التحقق' : 'Pending Verifications'}
                  </h2>
                  {pending.length > 0 && <Badge variant="amber">{pending.length}</Badge>}
                </div>

                {pending.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">{ar ? 'لا توجد طلبات معلقة' : 'No pending verifications'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pending.slice(0, 5).map((company) => (
                      <div key={company.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-800 text-sm">
                              {ar ? company.nameAr : company.nameEn}
                            </p>
                            <Badge variant="amber">{ar ? 'معلق' : 'Pending'}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                            <span>CR: {company.crNumber}</span>
                            {company.city && <span>{company.city}</span>}
                            <span>{new Date(company.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            loading={actionLoading === `verify-${company.id}`}
                            onClick={() => verify(company.id, 'verify')}
                          >
                            {ar ? 'توثيق' : 'Verify'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<XCircle className="h-3.5 w-3.5" />}
                            loading={actionLoading === `reject-${company.id}`}
                            onClick={() => verify(company.id, 'reject')}
                          >
                            {ar ? 'رفض' : 'Reject'}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {pending.length > 5 && (
                      <Link href={`${base}/admin/companies`} className="block text-center text-sm text-brand-700 hover:underline py-2">
                        {ar ? `عرض كل ${pending.length} طلب` : `View all ${pending.length} pending`}
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Recent audit activity */}
              <div className="card">
                <h2 className="font-semibold text-slate-800 mb-4">{ar ? 'آخر النشاطات' : 'Recent Activity'}</h2>
                {data.recentActivity.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">{ar ? 'لا يوجد نشاط' : 'No activity yet'}</p>
                ) : (
                  <div className="space-y-3">
                    {data.recentActivity.slice(0, 8).map((log) => (
                      <div key={log.id} className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
                          {(log.user?.fullName || 'S').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700">
                            <span className="text-brand-700">{log.action}</span>
                            {' · '}{log.entity}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {log.user?.fullName || 'System'} · {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
