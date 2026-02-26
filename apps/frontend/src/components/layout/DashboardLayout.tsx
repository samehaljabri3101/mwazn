'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { PageSpinner } from '@/components/ui/Spinner';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      const locale = pathname.split('/')[1] || 'en';
      router.replace(`/${locale}/auth/login`);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) return <PageSpinner />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 max-w-[1200px]">{children}</main>
      </div>
    </div>
  );
}
