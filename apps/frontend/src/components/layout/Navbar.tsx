'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Globe, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  transparent?: boolean;
}

export function Navbar({ transparent = false }: NavbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const otherLocale = locale === 'en' ? 'ar' : 'en';

  const switchLocale = () => {
    const path = window.location.pathname.replace(`/${locale}`, `/${otherLocale}`);
    window.location.href = path;
  };

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
            <Link href={`/${locale}/marketplace`} className="btn-ghost text-sm">
              {t('nav.marketplace')}
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
              <div className="flex items-center gap-2">
                <Link href={`/${locale}/dashboard`}>
                  <Button size="sm" variant="secondary">{t('nav.dashboard')}</Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={logout}>{t('common.logout')}</Button>
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
          <Link href={`/${locale}/marketplace`} className="block sidebar-link">{t('nav.marketplace')}</Link>
          <button onClick={switchLocale} className="block sidebar-link w-full text-start">
            <Globe className="h-4 w-4" />
            {otherLocale === 'ar' ? 'عربي' : 'English'}
          </button>
          {user ? (
            <>
              <Link href={`/${locale}/dashboard`} className="block sidebar-link">{t('nav.dashboard')}</Link>
              <button onClick={logout} className="block sidebar-link w-full text-start">{t('common.logout')}</button>
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
