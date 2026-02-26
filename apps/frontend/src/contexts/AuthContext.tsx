'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { User, Company } from '@/types';

interface AuthContextValue {
  user: User | null;
  company: Company | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('mwazn_access_token');
      const storedUser = localStorage.getItem('mwazn_user');
      const storedCompany = localStorage.getItem('mwazn_company');
      if (storedToken && storedUser && storedCompany) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
        setCompany(JSON.parse(storedCompany));
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const persist = useCallback((token: string, refresh: string, u: User, c: Company) => {
    localStorage.setItem('mwazn_access_token', token);
    localStorage.setItem('mwazn_refresh_token', refresh);
    localStorage.setItem('mwazn_user', JSON.stringify(u));
    localStorage.setItem('mwazn_company', JSON.stringify(c));
    setAccessToken(token);
    setUser(u);
    setCompany(c);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken: token, refreshToken, user: u, company: c } = data.data;
    persist(token, refreshToken, u, c);
  }, [persist]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('mwazn_refresh_token');
      await api.post('/auth/logout', { refreshToken });
    } catch { /* ignore */ }
    localStorage.removeItem('mwazn_access_token');
    localStorage.removeItem('mwazn_refresh_token');
    localStorage.removeItem('mwazn_user');
    localStorage.removeItem('mwazn_company');
    setUser(null);
    setCompany(null);
    setAccessToken(null);
    router.push('/en/auth/login');
  }, [router]);

  const refresh = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    const { user: u, company: c } = data.data;
    setUser(u);
    setCompany(c);
    localStorage.setItem('mwazn_user', JSON.stringify(u));
    localStorage.setItem('mwazn_company', JSON.stringify(c));
  }, []);

  return (
    <AuthContext.Provider value={{ user, company, accessToken, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
