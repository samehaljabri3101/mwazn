'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Message, Conversation } from '@/types';
import { ChevronLeft, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function ConversationPage() {
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const { company, user } = useAuth();
  const ar = locale === 'ar';

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const socketRef = useRef<any>(null);
  const socketConnected = useRef(false);

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const res = await api.get(`/conversations/${id}/messages`);
      const msgs: Message[] = res.data.data?.items || res.data.data || [];
      setMessages(msgs);
      if (!silent) setLoading(false);
    } catch {
      if (!silent) setLoading(false);
    }
  }, [id]);

  const fetchConversation = useCallback(async () => {
    try {
      const res = await api.get('/conversations');
      const convs: Conversation[] = res.data.data?.items || res.data.data || [];
      const found = convs.find((c) => c.id === id);
      setConversation(found || null);
    } catch { /* silent */ }
  }, [id]);

  // Set up Socket.io connection with polling fallback
  useEffect(() => {
    fetchConversation();
    fetchMessages();

    const apiUrl = (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001');
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    let socket: ReturnType<typeof import('socket.io-client').io> | null = null;

    import('socket.io-client').then(({ io }) => {
      socket = io(`${apiUrl}/chat`, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 3,
      });

      socket.on('connect', () => {
        socketConnected.current = true;
        socket!.emit('join', { conversationId: id });
        // Clear polling when socket connected
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      });

      socket.on('message', (msg: Message) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });

      socket.on('typing', ({ userId: typingUserId }: { userId: string }) => {
        if (typingUserId !== user?.id) {
          setTypingIndicator(true);
          if (typingRef.current) clearTimeout(typingRef.current);
          typingRef.current = setTimeout(() => setTypingIndicator(false), 3000);
        }
      });

      socket.on('connect_error', () => {
        socketConnected.current = false;
        // Fall back to polling if socket fails
        if (!pollingRef.current) {
          pollingRef.current = setInterval(() => fetchMessages(true), 5000);
        }
      });

      socket.on('disconnect', () => {
        socketConnected.current = false;
        // Resume polling on disconnect
        if (!pollingRef.current) {
          pollingRef.current = setInterval(() => fetchMessages(true), 5000);
        }
      });

      socketRef.current = socket;
    }).catch(() => {
      // socket.io-client not available, use polling
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => fetchMessages(true), 5000);
      }
    });

    // Start polling as initial fallback until socket connects
    const fallbackTimeout = setTimeout(() => {
      if (!socketConnected.current && !pollingRef.current) {
        pollingRef.current = setInterval(() => fetchMessages(true), 5000);
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimeout);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (typingRef.current) clearTimeout(typingRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [fetchConversation, fetchMessages, id, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!body.trim()) return;
    const msgBody = body.trim();
    setSending(true);

    // Optimistic UI update
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      body: msgBody,
      conversationId: id,
      senderId: user?.id ?? '',
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: { id: user?.id ?? '', fullName: user?.fullName ?? '', companyId: company?.id ?? '' },
    };

    if (socketConnected.current && socketRef.current) {
      setMessages((prev) => [...prev, tempMsg]);
      setBody('');
      socketRef.current.emit('message', { conversationId: id, body: msgBody });
      setSending(false);
    } else {
      setBody('');
      try {
        await api.post(`/conversations/${id}/messages`, { body: msgBody });
        await fetchMessages(true);
      } catch { /* silent */ }
      setSending(false);
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (socketConnected.current && socketRef.current) {
      socketRef.current.emit('typing', { conversationId: id, userId: user?.id });
    }
  };

  const otherCompany = conversation?.participants.find((p) => p.id !== company?.id);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <Link href={`/${locale}/dashboard/messages`} className="btn-ghost p-2">
            <ChevronLeft className="h-5 w-5 rtl-mirror" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 font-bold text-lg">
            {(otherCompany?.nameEn || otherCompany?.nameAr || 'U').charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              {ar ? otherCompany?.nameAr : otherCompany?.nameEn}
            </p>
            {conversation?.subject && (
              <p className="text-xs text-slate-400">{conversation.subject}</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-3/4" />)}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
              <p className="text-2xl mb-2">💬</p>
              <p className="font-medium text-slate-600">
                {ar ? 'ابدأ المحادثة' : 'Start the conversation'}
              </p>
              <p className="text-sm mt-1">
                {ar ? 'أرسل رسالتك الأولى' : 'Send your first message'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender?.companyId === company?.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {!isOwn && (
                      <p className="text-xs text-slate-400 px-1">{msg.sender?.fullName}</p>
                    )}
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                      isOwn
                        ? 'bg-brand-700 text-white rounded-br-sm'
                        : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-card'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 px-1">
                      {format(new Date(msg.createdAt), 'hh:mm a')}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {typingIndicator && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-100 px-4 py-2.5 shadow-card">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={ar ? 'اكتب رسالتك... (Enter للإرسال)' : 'Type your message... (Enter to send)'}
              rows={1}
              className="input-base flex-1 resize-none max-h-32 overflow-y-auto"
              style={{ minHeight: '44px' }}
            />
            <Button
              onClick={sendMessage}
              loading={sending}
              disabled={!body.trim()}
              icon={<Send className="h-4 w-4" />}
              className="shrink-0 h-11"
            >
              {ar ? 'إرسال' : 'Send'}
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 ms-1">
            {ar ? 'Shift+Enter لسطر جديد' : 'Shift+Enter for new line'}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
