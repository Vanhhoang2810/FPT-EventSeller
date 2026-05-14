import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader2, MessageCircle, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { selectCurrentUser } from '../../auth/store/authSlice';
import { useSocket } from '../../../shared/hooks/useSocket';
import {
  useStartConversationMutation,
  useGetChatMessagesQuery,
  useSendMessageMutation,
  useRecallMessageMutation,
  useDeleteMyConversationMutation,
  useMarkAdminMessagesReadMutation,
} from '../services/chatApi';
import type { ChatMessage } from '../services/chatApi';
import { cn } from '../../../shared/utils/cn';

function getVisitorId(): string {
  let id = localStorage.getItem('tr_visitor_id');
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('tr_visitor_id', id);
  }
  return id;
}

function AgentAvatar({ size = 36 }: { size?: number }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-white font-bold"
        style={{ fontSize: size * 0.35, background: 'linear-gradient(135deg, #059669, #10B981)' }}
      >
        TR
      </div>
      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border border-background" />
    </div>
  );
}

export function ChatWidget() {
  const { t } = useTranslation('common');
  const user = useSelector(selectCurrentUser);
  const socketRef = useSocket();

  const [open, setOpen]             = useState(false);
  const [minimized, setMinimized]   = useState(false);
  const [conversationId, setConvId] = useState<number | null>(null);
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [input, setInput]           = useState('');
  const typingTimerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [unread, setUnread]         = useState(0);
  const [isTyping, setIsTyping]     = useState(false);
  const [preName, setPreName]       = useState('');
  const [preEmail, setPreEmail]     = useState('');
  const [preEmailErr, setErr]       = useState(false);
  const [showPre, setShowPre]       = useState(false);
  // Fix 6: error state khi gửi tin thất bại
  const [sendError, setSendError]   = useState(false);
  // Fix 9: trạng thái conv để hiện banner khi closed
  const [convStatus, setConvStatus] = useState<string>('open');

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  // useRef để visitorId ổn định suốt lifetime component — tránh stale khi auth thay đổi in-place
  const visitorIdRef = useRef<string | undefined>(user ? undefined : getVisitorId());
  const visitorId    = visitorIdRef.current;

  const [startConversation, { isLoading: isStarting }] = useStartConversationMutation();
  const [sendMessage,       { isLoading: isSending }]  = useSendMessageMutation();
  const [recallMessage]                                 = useRecallMessageMutation();
  const [deleteMyConv]                                  = useDeleteMyConversationMutation();
  const [markAdminRead]                                 = useMarkAdminMessagesReadMutation();

  const { data: msgsData, refetch: refetchMessages } = useGetChatMessagesQuery(conversationId!, {
    skip: !conversationId, refetchOnMountOrArgChange: true,
  });

  // Merge DB data với local state — giữ is_read/is_recalled nếu đã update qua socket
  useEffect(() => {
    if (!msgsData?.data) return;
    setMessages((prev) =>
      msgsData.data.map((dbMsg) => {
        const local = prev.find((m) => m.id === dbMsg.id);
        if (local?.is_read && !dbMsg.is_read) return { ...dbMsg, is_read: true };
        if (local?.is_recalled && !dbMsg.is_recalled) return { ...dbMsg, is_recalled: true };
        return dbMsg;
      })
    );
  }, [msgsData]);

  const playNotifSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const playTing = (freq: number, startTime: number, duration: number, volume: number) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playTing(1174, ctx.currentTime, 0.18, 0.22);
      playTing(880, ctx.currentTime + 0.18, 0.22, 0.18);
      setTimeout(() => ctx.close(), 600);
    } catch { /* browser blocked autoplay */ }
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;
    socket.emit('chat:join', conversationId);
    const onMsg = (data: { conversationId: number; message: ChatMessage }) => {
      if (data.conversationId !== conversationId) return;
      setMessages((p) => p.find((m) => m.id === data.message.id) ? p : [...p, data.message]);
      if (data.message.sender_type === 'admin') {
        if (!open || minimized) {
          setUnread((n) => n + 1);
          playNotifSound();
        }
      }
    };
    const onTyping = (data: { conversationId: number; typing: boolean }) => {
      if (data.conversationId === conversationId) setIsTyping(data.typing);
    };
    const onRecalled = (data: { messageId: number }) => {
      setMessages((p) => p.map((m) => m.id === data.messageId ? { ...m, is_recalled: true } : m));
    };
    const onMessagesRead = () => {
      setMessages((p) => p.map((m) =>
        (m.sender_type === 'user' || m.sender_type === 'visitor') ? { ...m, is_read: true } : m
      ));
      refetchMessages().catch(() => {});
    };
    // Fix 9: lắng nghe status thay đổi từ admin
    const onStatusChanged = (data: { conversationId: number; status: string }) => {
      if (data.conversationId === conversationId) setConvStatus(data.status);
    };
    socket.on('chat:message', onMsg);
    socket.on('chat:typing', onTyping);
    socket.on('chat:recalled', onRecalled);
    socket.on('chat:messages_read', onMessagesRead);
    socket.on('chat:status_changed', onStatusChanged);
    return () => {
      socket.emit('chat:leave', conversationId);
      socket.off('chat:message', onMsg);
      socket.off('chat:typing', onTyping);
      socket.off('chat:recalled', onRecalled);
      socket.off('chat:messages_read', onMessagesRead);
      socket.off('chat:status_changed', onStatusChanged);
    };
  }, [socketRef, conversationId, open, minimized, refetchMessages, playNotifSound]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  useEffect(() => {
    if (open && !minimized) {
      setUnread(0);
      if (conversationId) markAdminRead(conversationId).catch(() => {});
    }
  }, [open, minimized, conversationId]);

  const initConv = useCallback(async (name?: string, email?: string) => {
    try {
      const res = await startConversation({
        visitorId, userId: user?.id,
        visitorName: name || user?.fullName || localStorage.getItem('tr_chat_name') || t('chatWidget.guest'),
        visitorEmail: email || user?.email || localStorage.getItem('tr_chat_email') || undefined,
      }).unwrap();
      setConvId(res.data.conversationId);
      setConvStatus(res.data.status);
      // Fix 2: seed unread badge từ DB khi refresh trang
      if (res.data.unread_user > 0) setUnread(res.data.unread_user);
    } catch { /* silent */ }
  }, [visitorId, user, startConversation, t]);

  const handleOpen = useCallback(async () => {
    setOpen(true); setMinimized(false);
    if (!conversationId) {
      if (!user && !localStorage.getItem('tr_chat_name')) { setShowPre(true); return; }
      await initConv();
    }
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [conversationId, user, initConv]);

  const isValidEmail = (e: string) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handlePreSubmit = async () => {
    if (!preName.trim()) return;
    if (preEmail && !isValidEmail(preEmail)) { setErr(true); return; }
    setErr(false);
    localStorage.setItem('tr_chat_name', preName);
    if (preEmail) localStorage.setItem('tr_chat_email', preEmail);
    setShowPre(false);
    await initConv(preName, preEmail);
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  const emitTyping = useCallback((typing: boolean) => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;
    socket.emit('chat:typing', {
      conversationId,
      typing,
      senderType: user ? 'user' : 'visitor',
    });
  }, [socketRef, conversationId, user]);

  const handleInputChange = useCallback((val: string) => {
    setInput(val);
    setSendError(false);
    if (!conversationId) return;
    emitTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => emitTyping(false), 1500);
  }, [conversationId, emitTyping]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || isSending) return;
    const content = input.trim();
    setInput('');
    setSendError(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    emitTyping(false);
    const temp: ChatMessage = {
      id: Date.now(), conversation_id: conversationId,
      sender_type: user ? 'user' : 'visitor', sender_id: user?.id ?? null,
      sender_name: user?.fullName || localStorage.getItem('tr_chat_name') || t('chatWidget.guest'),
      content, is_read: false, is_recalled: false, created_at: new Date().toISOString(),
    };
    setMessages((p) => [...p, temp]);
    try {
      // Fix 4: truyền visitorId để backend kiểm tra ownership
      await sendMessage({
        conversationId, content,
        senderType: user ? 'user' : 'visitor',
        senderId: user?.id,
        senderName: user?.fullName || localStorage.getItem('tr_chat_name') || t('chatWidget.guest'),
        visitorId: user ? undefined : visitorId,
      });
    } catch {
      // Fix 6: hiện lỗi khi gửi thất bại, rollback optimistic message
      setMessages((p) => p.filter((m) => m.id !== temp.id));
      setInput(content);
      setSendError(true);
    }
  };

  const senderName = user?.fullName || localStorage.getItem('tr_chat_name') || t('chatWidget.guest');
  const HEADER_H = 68;
  const INPUT_H  = 64;
  const WIN_H    = 520;
  const BODY_H   = WIN_H - HEADER_H - INPUT_H;

  return (
    <>
      {/* ── CHAT WINDOW ── */}
      {open && (
        <div
          className={cn(
            'fixed bottom-[84px] right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[370px] rounded-2xl overflow-hidden',
            'transition-all duration-300 ease-out',
            'bg-card border border-border',
          )}
          style={{
            height: minimized ? HEADER_H : WIN_H,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(5,150,105,0.10)',
          }}
        >
          {/* ── HEADER ── */}
          <div
            className="flex items-center justify-between px-4 flex-shrink-0"
            style={{
              height: HEADER_H,
              background: 'rgba(5,150,105,0.12)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(16,185,129,0.18)',
            }}
          >
            <div className="flex items-center gap-3">
              <AgentAvatar size={36} />
              <div>
                <p className="text-[13px] font-semibold text-foreground leading-tight">{t('chatWidget.agentName')}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-muted-foreground">{t('chatWidget.online')} · {t('chatWidget.responseTime')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {conversationId && (
                <button
                  onClick={async () => {
                    if (!confirm(t('chatWidget.deleteConfirm'))) return;
                    await deleteMyConv({
                      id: conversationId,
                      visitorId: user ? undefined : getVisitorId(),
                      userId: user?.id,
                    });
                    setConvId(null); setMessages([]); setOpen(false);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all text-[11px]"
                  title={t('chatWidget.deleteConv')}
                >
                  🗑
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-all">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* ── BODY ── */}
          {!minimized && (
            <>
              {showPre ? (
                <div className="flex flex-col items-center justify-center px-6 gap-5 bg-background"
                  style={{ height: WIN_H - HEADER_H }}>
                  <div className="text-center">
                    <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <MessageCircle size={26} className="text-emerald-500" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{t('chatWidget.preChatTitle')}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {t('chatWidget.preChatSubtitle')}
                    </p>
                  </div>
                  <div className="w-full space-y-3">
                    <input
                      value={preName}
                      onChange={(e) => setPreName(e.target.value)}
                      placeholder={t('chatWidget.namePlaceholder')}
                      autoFocus
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && handlePreSubmit()}
                    />
                    <div>
                      <input
                        value={preEmail}
                        onChange={(e) => { setPreEmail(e.target.value); setErr(false); }}
                        placeholder={t('chatWidget.emailPlaceholder')}
                        type="email"
                        className={cn(
                          'w-full rounded-xl border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all',
                          preEmailErr ? 'border-red-400/60' : 'border-border',
                        )}
                        onKeyDown={(e) => e.key === 'Enter' && handlePreSubmit()}
                      />
                      {preEmailErr && <p className="mt-1.5 text-xs text-red-400 pl-1">{t('chatWidget.emailError')}</p>}
                    </div>
                    <button
                      onClick={handlePreSubmit}
                      disabled={!preName.trim() || isStarting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
                    >
                      {isStarting
                        ? <><Loader2 size={14} className="animate-spin" /> {t('chatWidget.connecting')}</>
                        : <><Sparkles size={14} /> {t('chatWidget.startChat')} <ArrowRight size={14} /></>}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Fix 9: banner khi conv bị đóng */}
                  {convStatus === 'closed' && (
                    <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                      <AlertCircle size={12} className="text-amber-500 flex-shrink-0" />
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">
                        {t('chatWidget.convClosed')}
                      </span>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="overflow-y-auto px-4 py-4 space-y-3 bg-secondary/40"
                    style={{ height: convStatus === 'closed' ? BODY_H - 32 : BODY_H }}>

                    {messages.length === 0 && !isStarting && (
                      <div className="flex gap-2.5 items-end">
                        <AgentAvatar size={26} />
                        <div className="max-w-[78%]">
                          <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                            <p className="text-[13px] text-foreground leading-relaxed">
                              {t('chatWidget.welcomeMsg', { name: senderName })}
                            </p>
                            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                              {t('chatWidget.welcomeSub')}
                            </p>
                          </div>
                          <p className="text-[10px] text-muted-foreground/50 mt-1 ml-1">{t('chatWidget.agentName')}</p>
                        </div>
                      </div>
                    )}

                    {isStarting && (
                      <div className="flex items-center justify-center py-8 gap-2">
                        <Loader2 size={16} className="text-emerald-500 animate-spin" />
                        <span className="text-sm text-muted-foreground">{t('chatWidget.connecting')}</span>
                      </div>
                    )}

                    {messages.map((msg, i) => {
                      const isMe = msg.sender_type === 'user' || msg.sender_type === 'visitor';
                      const showAvatar = !isMe && msg.sender_type !== messages[i - 1]?.sender_type;
                      const canRecall = isMe && !msg.is_recalled &&
                        Date.now() - new Date(msg.created_at).getTime() < 5 * 60 * 1000;

                      return (
                        <div key={msg.id} className={cn('flex gap-2 items-end group/msg', isMe && 'flex-row-reverse')}>
                          <div style={{ width: 26, flexShrink: 0 }}>
                            {!isMe && showAvatar && <AgentAvatar size={26} />}
                          </div>
                          <div className={cn('max-w-[76%] flex flex-col', isMe ? 'items-end' : 'items-start')}>
                            <div className="relative">
                              <div className={cn(
                                'px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm',
                                msg.is_recalled
                                  ? 'rounded-2xl bg-secondary border border-border text-muted-foreground/60 italic'
                                  : isMe
                                    ? 'rounded-2xl rounded-br-sm text-white'
                                    : 'rounded-2xl rounded-bl-sm bg-card border border-border text-foreground',
                              )}
                                style={!msg.is_recalled && isMe ? { background: 'linear-gradient(135deg, #059669, #10B981)' } : {}}>
                                {msg.is_recalled ? t('chatWidget.recalled') : msg.content}
                              </div>
                              {canRecall && conversationId && (
                                <button
                                  onClick={() => recallMessage({ convId: conversationId, msgId: msg.id })}
                                  className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded-full bg-secondary border border-border text-muted-foreground hover:text-red-400 hover:border-red-300 text-[10px]"
                                  title={t('chatWidget.recall')}
                                >
                                  ↩
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground/50 mt-1 mx-1 flex items-center gap-1">
                              {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              {isMe && !msg.is_recalled && (
                                <span
                                  className={cn(
                                    'transition-colors text-[11px] font-medium',
                                    msg.is_read ? 'text-emerald-400' : 'text-muted-foreground/40',
                                  )}
                                  title={msg.is_read ? t('chatWidget.readStatus') : t('chatWidget.sentStatus')}
                                >
                                  {msg.is_read ? '✓✓' : '✓'}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {isTyping && (
                      <div className="flex gap-2 items-end">
                        <AgentAvatar size={26} />
                        <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 cursor-default"
                          title={t('chatWidget.typing')}>
                          {[0, 150, 300].map((d) => (
                            <span key={d} className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                              style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input bar */}
                  <div className="flex flex-col bg-card border-t border-border flex-shrink-0" style={{ minHeight: INPUT_H }}>
                    {/* Fix 6: hiện lỗi khi gửi thất bại */}
                    {sendError && (
                      <div className="flex items-center gap-1.5 px-3.5 pt-2 text-[11px] text-red-400">
                        <AlertCircle size={11} />
                        {t('chatWidget.sendError')}
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 px-3.5" style={{ height: INPUT_H }}>
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder={t('chatWidget.inputPlaceholder')}
                        disabled={!conversationId || isSending}
                        className={cn(
                          'flex-1 rounded-xl bg-secondary px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none border transition-colors',
                          sendError ? 'border-red-400/40' : 'border-transparent',
                        )}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || !conversationId || isSending}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-35"
                        style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
                      >
                        {isSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── FLOATING BUTTON ── */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {!open && (
          <div
            className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold whitespace-nowrap"
            style={{
              background: 'rgba(5,150,105,0.15)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(16,185,129,0.35)',
              color: 'var(--color-primary-500, #10b981)',
              boxShadow: '0 4px 16px rgba(5,150,105,0.15)',
            }}
          >
            {t('chatWidget.tooltip')}
          </div>
        )}

        <button
          onClick={() => { if (!open) handleOpen(); else setOpen(false); }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full text-white transition-all hover:scale-110 active:scale-95"
          style={{
            background: 'rgba(5,150,105,0.20)',
            backdropFilter: 'blur(20px) saturate(200%)',
            WebkitBackdropFilter: 'blur(20px) saturate(200%)',
            border: '1px solid rgba(16,185,129,0.50)',
            boxShadow: '0 8px 28px rgba(5,150,105,0.30), 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.20)',
          }}
          aria-label="Chat support"
        >
          {open
            ? <X size={20} strokeWidth={2.5} className="text-emerald-100" />
            : <MessageCircle size={20} className="text-emerald-100" />
          }

          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-1 border-2 border-background">
              {unread > 9 ? '9+' : unread}
            </span>
          )}

          {!open && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: 'rgba(5,150,105,0.6)' }} />
          )}
        </button>
      </div>
    </>
  );
}
