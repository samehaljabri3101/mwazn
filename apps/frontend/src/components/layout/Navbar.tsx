'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Globe, Menu, X, ChevronDown, User, LayoutDashboard, LogOut, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { user, company, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const otherLocale = locale === 'en' ? 'ar' : 'en';

  const switchLocale = () => {
    const path = window.location.pathname.replace(`/${locale}`, `/${otherLocale}`);
    window.location.href = path;
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const postRfqPath = user
    ? `/${locale}/dashboard/buyer/rfqs/new`
    : `/${locale}/auth/login`;

  const dashboardPath = company?.type === 'SUPPLIER'
    ? `/${locale}/dashboard/supplier`
    : `/${locale}/dashboard/buyer`;

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 border-b transition-all duration-200',
        transparent ? 'bg-white/80 backdrop-blur-md border-white/20' : 'bg-white border-slate-100',
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-700">
              <span className="text-sm font-bold text-white">م</span>
            </div>
            <span className="text-lg font-bold text-brand-700">
              {locale === 'ar' ? 'موازن' : 'Mwazn'}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href={`/${locale}/suppliers`} className="btn-ghost text-sm">
              {locale === 'ar' ? 'الموردون' : 'Vendors'}
            </Link>
            <Link href={`/${locale}/products`} className="btn-ghost text-sm">
              {locale === 'ar' ? 'المنتجات' : 'Products'}
            </Link>
            <Link href={postRfqPath} className="btn-ghost text-sm">
              {locale === 'ar' ? 'أنشر طلب' : 'Post RFQ'}
            </Link>
            <Link href={`/${locale}#how-it-works`} className="btn-ghost text-sm">
              {t('nav.how_it_works')}
            </Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={switchLocale} className="btn-ghost flex items-center gap-1.5 text-sm">
              <Globe className="h-4 w-4" />
              {otherLocale === 'ar' ? 'عربي' : 'EN'}
            </button>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-white text-sm font-semibold">
                    {user.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {user.fullName?.split(' ')[0] || user.email}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', dropdownOpen && 'rotate-180')} />
                </button>

                {dropdownOpen && (
                  <div className="absolute end-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white shadow-lg animate-slide-up z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    {/* Links */}
                    <div className="py-2">
                      <Link
                        href={dashboardPath}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-700 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {t('nav.dashboard')}
                      </Link>
                      <Link
                        href={`/${locale}/dashboard/profile`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-700 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 py-2">
                      <button
                        onClick={() => { setDropdownOpen(false); logout(); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('common.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href={`/${locale}/auth/login`}>
                  <Button size="sm" variant="ghost">{t('nav.login')}</Button>
                </Link>
                <Link href={`/${locale}/auth/register`}>
                  <Button size="sm">{t('nav.register')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden btn-ghost"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2 animate-slide-up">
          {user && (
            <div className="flex items-center gap-3 py-2 mb-2 border-b border-slate-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-white text-sm font-semibold">
                {user.fullName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
          )}
          <Link href={`/${locale}/suppliers`} className="block sidebar-link">{locale === 'ar' ? 'الموردون' : 'Suppliers'}</Link>
          <Link href={postRfqPath} className="flex items-center gap-2 sidebar-link">
            <FileText className="h-4 w-4" />
            {locale === 'ar' ? 'أنشر طلب' : 'Post RFQ'}
          </Link>
          <button onClick={switchLocale} className="flex items-center gap-2 sidebar-link w-full text-start">
            <Globe className="h-4 w-4" />
            {otherLocale === 'ar' ? 'عربي' : 'English'}
          </button>
          {user ? (
            <>
              <Link href={dashboardPath} className="flex items-center gap-2 sidebar-link">
                <LayoutDashboard className="h-4 w-4" />
                {t('nav.dashboard')}
              </Link>
              <Link href={`/${locale}/dashboard/profile`} className="flex items-center gap-2 sidebar-link">
                <User className="h-4 w-4" />
                {locale === 'ar' ? 'الملف الشخصي' : 'Profile'}
              </Link>
              <button onClick={logout} className="flex items-center gap-2 sidebar-link w-full text-start text-red-600">
                <LogOut className="h-4 w-4" />
                {t('common.logout')}
              </button>
            </>
          ) : (
            <>
              <Link href={`/${locale}/auth/login`} className="block sidebar-link">{t('nav.login')}</Link>
              <Link href={`/${locale}/auth/register`} className="btn-primary block text-center">{t('nav.register')}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
