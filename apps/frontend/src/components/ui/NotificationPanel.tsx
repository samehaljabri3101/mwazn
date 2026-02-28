'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Bell, X, Check, MessageSquare, FileText, Star, ShieldCheck, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar as arLocale, enUS } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

function TypeIcon({ type }: { type: string }) {
  const cls = 'h-4 w-4';
  if (type === 'MESSAGE') return <MessageSquare className={cls} />;
  if (type === 'QUOTE_RECEIVED' || type === 'QUOTE_ACCEPTED') return <FileText className={cls} />;
  if (type === 'DEAL_STATUS') return <Star className={cls} />;
  if (type === 'VERIFICATION') return <ShieldCheck className={cls} />;
  if (type === 'INVITE') return <Mail className={cls} />;
  return <Bell className={cls} />;
}

export function NotificationBell() {
  const locale = useLocale();
  const router = useRouter();
  const ar = locale === 'ar';
  const panelRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setCount(res.data.data?.count ?? 0);
    } catch { /* silent */ }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { limit: 15 } });
      setNotifications(res.data.data?.items || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCount(0);
    } catch { /* silent */ }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await api.patch(`/notifications/${n.id}/read`);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        setCount((c) => Math.max(0, c - 1));
      } catch { /* silent */ }
    }
    if (n.link) {
      setOpen(false);
      router.push(`/${locale}${n.link}`);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-11 end-0 w-80 rounded-2xl bg-white shadow-lift border border-slate-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-sm text-slate-800">
              {ar ? 'الإشعارات' : 'Notifications'}
              {count > 0 && (
                <span className="ms-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">{count}</span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] text-brand-700 hover:underline"
                >
                  <Check className="h-3 w-3" />
                  {ar ? 'قراءة الكل' : 'Mark all read'}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="ms-2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">{ar ? 'لا توجد إشعارات' : 'No notifications yet'}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-start px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                    !n.isRead ? 'bg-brand-50/50' : ''
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${!n.isRead ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                    <TypeIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {ar ? n.titleAr : n.titleEn}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {ar ? n.bodyAr : n.bodyEn}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                        locale: ar ? arLocale : enUS,
                      })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="h-2 w-2 rounded-full bg-brand-700 shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
