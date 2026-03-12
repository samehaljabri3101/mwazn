'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/components/ui/NotificationPanel';
import { SearchModal } from '@/components/ui/SearchModal';
import { Globe, Menu, X, ChevronDown, User, LayoutDashboard, LogOut, FileText, Plus, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const ar = locale === 'ar';
  const otherLocale = ar ? 'en' : 'ar';

  const switchLocale = () => {
    const path = window.location.pathname.replace(`/${locale}`, `/${otherLocale}`);
    window.location.href = path;
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ⌘K / Ctrl+K opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const postRfqPath = user
    ? `/${locale}/dashboard/buyer/rfqs/new`
    : `/${locale}/auth/login`;

  const dashboardPath = user?.role === 'PLATFORM_ADMIN'
    ? `/${locale}/dashboard/admin`
    : `/${locale}/dashboard`;

  const navLink = (href: string, label: string) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={cn(
          'text-sm font-medium px-3 py-2 rounded-lg transition-all duration-150',
          isActive
            ? 'text-brand-700 bg-brand-50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 transition-all duration-200',
        transparent
          ? 'bg-white/90 backdrop-blur-lg border-b border-slate-200/50 shadow-sm'
          : 'bg-white border-b border-slate-200/70 shadow-[0_1px_3px_0_rgb(0,0,0,0.05)]',
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[60px] items-center justify-between gap-6">

          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 shrink-0 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-sm group-hover:shadow transition-shadow">
              <span className="text-[15px] font-bold text-white leading-none">م</span>
            </div>
            <span className="text-[17px] font-extrabold tracking-tight text-brand-700 group-hover:text-brand-800 transition-colors">
              {ar ? 'موازن' : 'Mwazn'}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {navLink(`/${locale}/suppliers`, ar ? 'الموردون' : 'Suppliers')}
            {navLink(`/${locale}/products`, ar ? 'المنتجات' : 'Products')}
            <Link
              href={`/${locale}#how-it-works`}
              className="text-sm font-medium px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150"
            >
              {t('nav.how_it_works')}
            </Link>
          </div>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-1 shrink-0">

            {/* Search trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
              <kbd className="hidden lg:inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-400 font-mono leading-none">
                ⌘K
              </kbd>
            </button>

            {/* Post RFQ — primary CTA */}
            <Link
              href={postRfqPath}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors me-2"
            >
              <Plus className="h-3.5 w-3.5" />
              {ar ? 'أنشر طلب' : 'Post RFQ'}
            </Link>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Language Switch */}
            <button
              onClick={switchLocale}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{otherLocale === 'ar' ? 'عربي' : 'EN'}</span>
            </button>

            {user ? (
              <>
                <NotificationBell />

                {/* User Dropdown */}
                <div className="relative ms-1" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-white text-sm font-semibold shadow-sm">
                      {user.fullName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-700 max-w-[96px] truncate">
                      {user.fullName?.split(' ')[0] || user.email}
                    </span>
                    <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', dropdownOpen && 'rotate-180')} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute end-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white shadow-xl animate-slide-up z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.fullName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
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
                          {ar ? 'الملف الشخصي' : 'Profile'}
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
              </>
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

          {/* Mobile search icon */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
          >
            <Search className="h-5 w-5 text-slate-600" />
          </button>

          {/* Mobile Toggle */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen
              ? <X className="h-5 w-5 text-slate-600" />
              : <Menu className="h-5 w-5 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1 animate-slide-up">
          {user && (
            <div className="flex items-center gap-3 py-3 mb-2 border-b border-slate-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-white text-sm font-semibold shadow-sm">
                {user.fullName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.fullName}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <Link href={`/${locale}/suppliers`} onClick={() => setMenuOpen(false)} className="block sidebar-link">
            {ar ? 'الموردون' : 'Suppliers'}
          </Link>
          <Link href={`/${locale}/products`} onClick={() => setMenuOpen(false)} className="block sidebar-link">
            {ar ? 'المنتجات' : 'Products'}
          </Link>
          <Link href={postRfqPath} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 sidebar-link">
            <FileText className="h-4 w-4" />
            {ar ? 'أنشر طلب' : 'Post RFQ'}
          </Link>
          <button onClick={switchLocale} className="flex items-center gap-2 sidebar-link w-full text-start">
            <Globe className="h-4 w-4" />
            {otherLocale === 'ar' ? 'عربي' : 'English'}
          </button>

          {user ? (
            <>
              <div className="border-t border-slate-100 pt-1 mt-1">
                <Link href={dashboardPath} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 sidebar-link">
                  <LayoutDashboard className="h-4 w-4" />
                  {t('nav.dashboard')}
                </Link>
                <Link href={`/${locale}/dashboard/profile`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 sidebar-link">
                  <User className="h-4 w-4" />
                  {ar ? 'الملف الشخصي' : 'Profile'}
                </Link>
                <button onClick={logout} className="flex items-center gap-2 sidebar-link w-full text-start text-red-600">
                  <LogOut className="h-4 w-4" />
                  {t('common.logout')}
                </button>
              </div>
            </>
          ) : (
            <div className="pt-3 mt-1 border-t border-slate-100 flex gap-2">
              <Link href={`/${locale}/auth/login`} onClick={() => setMenuOpen(false)} className="flex-1 btn-secondary text-center text-sm py-2">
                {t('nav.login')}
              </Link>
              <Link href={`/${locale}/auth/register`} onClick={() => setMenuOpen(false)} className="flex-1 btn-primary text-center text-sm py-2">
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Search modal — rendered inside Navbar, position:fixed escapes layout */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}
