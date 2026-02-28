'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Conversation } from '@/types';
import { MessageSquare, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function MessagesPage() {
  const locale = useLocale();
  const { company } = useAuth();
  const ar = locale === 'ar';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/conversations').then((res) => {
      setConversations(res.data.data?.items || res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = conversations.filter((conv) => {
    if (!search) return true;
    const other = conv.participants.find((p) => p.id !== company?.id);
    const name = (ar ? other?.nameAr : other?.nameEn) || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
           conv.subject?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{ar ? 'الرسائل' : 'Messages'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {ar ? `${conversations.length} محادثة` : `${conversations.length} conversations`}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ar ? 'بحث في المحادثات...' : 'Search conversations...'}
            className="input-base ps-9"
          />
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-8 w-8" />}
            title={ar ? 'لا توجد محادثات' : 'No conversations'}
            description={ar ? 'ابدأ محادثة من صفحة الطلبات أو الصفقات' : 'Start a conversation from an RFQ or deal page'}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((conv) => {
              const other = conv.participants.find((p) => p.id !== company?.id);
              const lastMessage = conv.messages?.[conv.messages.length - 1];

              return (
                <Link
                  key={conv.id}
                  href={`/${locale}/dashboard/messages/${conv.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 hover:border-brand-200 hover:bg-brand-50/30 transition-all"
                >
                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 font-bold text-lg">
                    {(other?.nameEn || other?.nameAr || 'U').charAt(0)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800 text-sm truncate">
                        {ar ? other?.nameAr : other?.nameEn}
                      </p>
                      <span className="text-xs text-slate-400 shrink-0">
                        {format(new Date(conv.updatedAt), 'dd MMM')}
                      </span>
                    </div>
                    {conv.subject && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{conv.subject}</p>
                    )}
                    {lastMessage && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{lastMessage.body}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
