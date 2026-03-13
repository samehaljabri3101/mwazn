'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Package,
  Users,
  ScrollText,
  ShieldCheck,
  Briefcase,
  Zap,
  BarChart2,
  BarChart3,
  Upload,
  Shield,
  Flag,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

export function Sidebar() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role;

  const base = `/${locale}/dashboard`;

  const allItems: NavItem[] = [
    // Common
    { href: `${base}`,              label: t('overview'),  icon: <LayoutDashboard className="h-4 w-4" /> },

    // Buyer
    { href: `${base}/buyer/rfqs`,        label: role === 'CUSTOMER' ? (locale === 'ar' ? 'طلباتي' : 'My Requests') : t('rfqs'), icon: <FileText className="h-4 w-4" />, roles: ['BUYER_ADMIN', 'CUSTOMER'] },
    { href: `${base}/buyer/deals`,       label: t('deals'),     icon: <Briefcase className="h-4 w-4" />,  roles: ['BUYER_ADMIN', 'CUSTOMER'] },
    { href: `${base}/buyer/appeals`,     label: locale === 'ar' ? 'اعتراضاتي' : 'My Appeals', icon: <Flag className="h-4 w-4" />, roles: ['BUYER_ADMIN', 'CUSTOMER'] },

    // Supplier / Freelancer
    { href: `${base}/supplier/listings`, label: t('listings'),  icon: <Package className="h-4 w-4" />,    roles: ['SUPPLIER_ADMIN', 'FREELANCER'] },
    { href: `${base}/supplier/rfqs`,     label: t('rfqs'),      icon: <FileText className="h-4 w-4" />,   roles: ['SUPPLIER_ADMIN', 'FREELANCER'] },
    { href: `${base}/supplier/quotes`,   label: t('quotes'),    icon: <ScrollText className="h-4 w-4" />, roles: ['SUPPLIER_ADMIN', 'FREELANCER'] },
    { href: `${base}/supplier/deals`,    label: t('deals'),     icon: <Briefcase className="h-4 w-4" />,  roles: ['SUPPLIER_ADMIN', 'FREELANCER'] },
    { href: `${base}/supplier/listings/import`, label: locale === 'ar' ? 'استيراد المنتجات' : 'Bulk Import', icon: <Upload className="h-4 w-4" />, roles: ['SUPPLIER_ADMIN', 'FREELANCER'] },
    { href: `${base}/supplier/appeals`,  label: locale === 'ar' ? 'اعتراضاتي' : 'My Appeals', icon: <Flag className="h-4 w-4" />, roles: ['SUPPLIER_ADMIN', 'FREELANCER'] },
    { href: `${base}/supplier/analytics`, label: locale === 'ar' ? 'التحليلات' : 'Analytics', icon: <BarChart3 className="h-4 w-4" />, roles: ['SUPPLIER_ADMIN', 'FREELANCER'] },

    // Common
    { href: `${base}/messages`,      label: t('messages'),  icon: <MessageSquare className="h-4 w-4" /> },
    { href: `${base}/analytics`,     label: locale === 'ar' ? 'التحليلات' : 'Analytics', icon: <BarChart2 className="h-4 w-4" />, roles: ['BUYER_ADMIN', 'CUSTOMER'] },

    // Supplier subscription (SUPPLIER_ADMIN only — FREELANCER has different model)
    { href: `${base}/subscription`,  label: locale === 'ar' ? 'الاشتراك' : 'Subscription', icon: <Zap className="h-4 w-4" />, roles: ['SUPPLIER_ADMIN'] },

    // Admin
    { href: `${base}/admin`,             label: 'Dashboard',      icon: <ShieldCheck className="h-4 w-4" />, roles: ['PLATFORM_ADMIN'] },
    { href: `${base}/admin/companies`,   label: t('companies'),   icon: <Users className="h-4 w-4" />,       roles: ['PLATFORM_ADMIN'] },
    { href: `${base}/admin/listings`,    label: locale === 'ar' ? 'المنتجات' : 'Listings',    icon: <Package className="h-4 w-4" />,    roles: ['PLATFORM_ADMIN'] },
    { href: `${base}/admin/moderation`,  label: locale === 'ar' ? 'الإشراف' : 'Moderation',   icon: <Shield className="h-4 w-4" />,     roles: ['PLATFORM_ADMIN'] },
    { href: `${base}/admin/appeals`,     label: locale === 'ar' ? 'الاعتراضات' : 'Appeals',   icon: <Flag className="h-4 w-4" />,       roles: ['PLATFORM_ADMIN'] },
  ];

  const visibleItems = allItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-e border-slate-100 bg-white px-3 py-4">
      <nav className="space-y-0.5">
        {visibleItems.map((item) => {
          const active = pathname === item.href || (item.href !== base && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-link', active && 'sidebar-link-active')}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
