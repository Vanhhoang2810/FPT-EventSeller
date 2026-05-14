import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageCircle, Send, X, CheckCircle, Clock, Loader2, User, Bot, Search, Circle, Trash2, MoreHorizontal, CheckCheck, Square, CheckSquare, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../../shared/hooks/useSocket';
import {
  useGetAdminConversationsQuery,
  useGetAdminMessagesQuery,
  useAdminReplyMutation,
  useUpdateConversationStatusMutation,
  useDeleteConversationMutation,
  useAdminRecallMessageMutation,
  useMarkConversationReadMutation,
  useMarkConversationUnreadMutation,
  useBulkActionMutation,
} from '../../chat/services/chatApi';
import type { ChatConversation, ChatMessage } from '../../chat/services/chatApi';
import { cn } from '../../../shared/utils/cn';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { useDispatch } from 'react-redux';
import { apiSlice } from '../../../app/api';

// Labels lấy qua t() trong component
const STATUS_COLOR: Record<string, string> = {
  open:        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  in_progress: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  closed:      'text-slate-400 bg-slate-500/10 border-slate-500/20',
};
// Giữ lại cho backward compat với code dùng .label
const STATUS_CONFIG = {
  open:        { label: '', color: STATUS_COLOR.open },
  in_progress: { label: '', color: STATUS_COLOR.in_progress },
  closed:      { label: '', color: STATUS_COLOR.closed },
};

export function AdminChatPage() {
  const { t } = useTranslation('admin');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socketRef = useSocket();

  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [reply, setReply]               = useState('');
  const [convTyping, setConvTyping]     = useState<Record<number, boolean>>({});
  const adminTypingTimer                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [liveMessages, setLiveMessages] = useState<Record<number, ChatMessage[]>>({});
  const [unreadMap, setUnreadMap] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  // Bulk selection
  const [selected, setSelected]         = useState<Set<number>>(new Set());
  const [openMenuId, setOpenMenuId]     = useState<number | null>(null); // id của conv đang mở ...
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: convsData, refetch: refetchConvs } = useGetAdminConversationsQuery(statusFilter);
  const { data: messagesData } = useGetAdminMessagesQuery(activeConvId!, { skip: !activeConvId });
  const [adminReply, { isLoading: isReplying }] = useAdminReplyMutation();
  const [updateStatus]       = useUpdateConversationStatusMutation();
  const [deleteConversation] = useDeleteConversationMutation();
  const [adminRecall]        = useAdminRecallMessageMutation();
  const [markRead]           = useMarkConversationReadMutation();
  const [markUnread]         = useMarkConversationUnreadMutation();
  const [bulkAction]         = useBulkActionMutation();

  const conversations = (convsData?.data ?? []).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.visitor_name?.toLowerCase().includes(q) ||
      c.visitor_email?.toLowerCase().includes(q) ||
      c.user?.full_name?.toLowerCase().includes(q) ||
      c.user?.email?.toLowerCase().includes(q)
    );
  });

  // Socket.IO — nhận tin nhắn real-time
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join:admin');

    const handleNewConv = () => { refetchConvs(); };
    const handleMessage = (data: { conversationId: number; message: ChatMessage }) => {
      const { conversationId, message } = data;
      setLiveMessages((prev) => {
        const existing = prev[conversationId] ?? [];
        if (existing.find((m) => m.id === message.id)) return prev;
        return { ...prev, [conversationId]: [...existing, message] };
      });
      if (conversationId !== activeConvId) {
        setUnreadMap((prev) => ({ ...prev, [conversationId]: (prev[conversationId] ?? 0) + 1 }));
      }
      // Invalidate conversation list để cập nhật last_message_at
      dispatch(apiSlice.util.invalidateTags([{ type: 'Chat', id: 'LIST' }]));
    };

    const handleRecalled = (data: { conversationId: number; messageId: number }) => {
      setLiveMessages((prev) => {
        const msgs = prev[data.conversationId] ?? [];
        return {
          ...prev,
          [data.conversationId]: msgs.map((m) =>
            m.id === data.messageId ? { ...m, is_recalled: true } : m
          ),
        };
      });
    };

    // User đã đọc tin admin → cập nhật is_read = true cho admin messages
    const handleMessagesRead = (data: { conversationId: number }) => {
      setLiveMessages((prev) => {
        const msgs = prev[data.conversationId] ?? [];
        return {
          ...prev,
          [data.conversationId]: msgs.map((m) =>
            m.sender_type === 'admin' ? { ...m, is_read: true } : m
          ),
        };
      });
    };

    const handleTyping = (data: { conversationId: number; typing: boolean; senderType?: string }) => {
      if (data.senderType !== 'admin') {
        setConvTyping((prev) => ({ ...prev, [data.conversationId]: data.typing }));
      }
    };

    socket.on('chat:new_conversation', handleNewConv);
    socket.on('chat:message', handleMessage);
    socket.on('chat:recalled', handleRecalled);
    socket.on('chat:messages_read', handleMessagesRead);
    socket.on('chat:typing', handleTyping);
    return () => {
      socket.off('chat:new_conversation', handleNewConv);
      socket.off('chat:message', handleMessage);
      socket.off('chat:recalled', handleRecalled);
      socket.off('chat:messages_read', handleMessagesRead);
      socket.off('chat:typing', handleTyping);
    };
  }, [socketRef, activeConvId, refetchConvs, dispatch]);

  // Join/leave chat room khi chọn conversation
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConvId) return;
    socket.emit('chat:join', activeConvId);
    return () => { socket.emit('chat:leave', activeConvId); };
  }, [socketRef, activeConvId]);

  // Fix read-receipt trigger: mark-as-read chỉ khi tab đang visible (không bắn khi tab nền)
  useEffect(() => {
    if (!activeConvId) return;
    const doMarkRead = () => {
      if (document.visibilityState === 'visible') {
        markRead(activeConvId).catch(() => {});
        setUnreadMap((prev) => ({ ...prev, [activeConvId]: 0 }));
      }
    };
    doMarkRead();
    document.addEventListener('visibilitychange', doMarkRead);
    return () => document.removeEventListener('visibilitychange', doMarkRead);
  }, [activeConvId, markRead]);

  // Merge API messages + live messages
  const allMessages = (() => {
    const base = messagesData?.data ?? [];
    const live = liveMessages[activeConvId!] ?? [];
    const merged = [...base];
    live.forEach((m) => { if (!merged.find((x) => x.id === m.id)) merged.push(m); });
    return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  })();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  const handleReply = async () => {
    if (!reply.trim() || !activeConvId || isReplying) return;
    const content = reply.trim();
    setReply('');
    try {
      await adminReply({ conversationId: activeConvId, content });
    } catch { /* silent */ }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const displayName = (c: ChatConversation) =>
    c.user?.full_name || c.visitor_name || `Khách #${c.id}`;

  const totalUnread = Object.values(unreadMap).reduce((s, n) => s + n, 0);

  return (
    <div className="admin-bg flex h-[calc(100vh-56px)] -m-6 overflow-hidden">
      {/* ── LEFT: Conversation List ── responsive: ẩn trên mobile khi đang xem conv */}
      <div className={cn(
        'flex-shrink-0 border-r border-admin-border bg-admin-surface flex flex-col',
        'w-full md:w-[300px]',                              /* full width mobile, 300px desktop */
        activeConvId ? 'hidden md:flex' : 'flex',           /* mobile: ẩn khi đang xem conv */
      )}>
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-admin-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageCircle size={15} className="text-emerald-400" />
              {t('chat.title')}
              {totalUnread > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {totalUnread}
                </span>
              )}
            </h2>
            {/* Select all */}
            {conversations.length > 0 && (
              <button
                onClick={() => {
                  if (selected.size === conversations.length) {
                    setSelected(new Set());
                  } else {
                    setSelected(new Set(conversations.map((c) => c.id)));
                  }
                }}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {selected.size === conversations.length && conversations.length > 0
                  ? <><CheckSquare size={11} /> {t('chat.deselectAll')}</>
                  : <><Square size={11} /> {t('chat.selectAll')}</>
                }
              </button>
            )}
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('chat.searchPlaceholder')}
              className="w-full rounded-lg border border-admin-border bg-foreground/[0.03] py-1.5 pl-7 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-border/60 transition-colors" />
          </div>
          {/* Status filter */}
          <div className="flex gap-1 mt-2">
            {(['open', 'in_progress', 'closed'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn('flex-1 rounded-lg py-1 text-[10px] font-medium transition-all',
                  statusFilter === s
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25'
                    : 'text-muted-foreground hover:text-foreground'
                )}>
                {t(`chat.status.${s}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk toolbar */}
        {selected.size > 0 && (
          <div className="px-3 py-2 border-b border-admin-border bg-emerald-500/[0.06] flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-medium flex-1">
              {t('chat.selected', { count: selected.size })}
            </span>
            <button
              onClick={async () => {
                try {
                  await bulkAction({ ids: Array.from(selected), action: 'mark_read' }).unwrap();
                  setSelected(new Set());
                } catch { toast.error('Không thể đánh dấu đã đọc'); }
              }}
              className="flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <CheckCheck size={11} /> {t('chat.readAll')}
            </button>
            <button
              onClick={async () => {
                if (!confirm(t('chat.confirmBulkDelete', { count: selected.size }))) return;
                try {
                  await bulkAction({ ids: Array.from(selected), action: 'delete' }).unwrap();
                  setSelected(new Set());
                  if (selected.has(activeConvId!)) setActiveConvId(null);
                } catch { toast.error('Không thể xóa cuộc trò chuyện'); }
              }}
              className="flex items-center gap-1 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={11} /> {t('chat.deleteSelected')}
            </button>
            <button onClick={() => setSelected(new Set())}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/[0.06]">
              <X size={11} />
            </button>
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto" onClick={() => setOpenMenuId(null)}>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <MessageCircle size={28} className="text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground/50">{t('chat.noConversations')}</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive   = conv.id === activeConvId;
              const isSelected = selected.has(conv.id);
              const unread     = unreadMap[conv.id] ?? conv.unread_admin;
              const menuOpen   = openMenuId === conv.id;
              return (
                <div key={conv.id}
                  className={cn(
                    'group/conv relative flex items-start gap-2.5 px-3 py-3 border-b border-foreground/[0.04] transition-all cursor-pointer',
                    isActive    ? 'bg-emerald-500/[0.08] border-l-2 border-l-emerald-500' : '',
                    isSelected  ? 'bg-emerald-500/[0.05]' : 'hover:bg-foreground/[0.03]',
                  )}
                  onClick={() => { setActiveConvId(conv.id); setOpenMenuId(null); }}
                >
                  {/* Checkbox */}
                  <button
                    className={cn(
                      'flex-shrink-0 mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-all',
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500 opacity-100'
                        : 'border-foreground/25 bg-transparent opacity-0 group-hover/conv:opacity-100',
                      selected.size > 0 && !isSelected && 'opacity-60 group-hover/conv:opacity-100',
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected((prev) => {
                        const next = new Set(prev);
                        next.has(conv.id) ? next.delete(conv.id) : next.add(conv.id);
                        return next;
                      });
                    }}
                  >
                    {isSelected && (
                      <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-none stroke-current" strokeWidth="2">
                        <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Avatar — click → profile (nếu là user đăng ký) */}
                  <div
                    className="h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #059669, #0891b2)',
                      cursor: conv.user_id ? 'pointer' : 'default',
                    }}
                    onClick={(e) => {
                      if (conv.user_id) {
                        e.stopPropagation();
                        navigate(`/admin/users?highlight=${conv.user_id}`);
                      }
                    }}
                    title={conv.user_id ? t('chat.viewProfile') : undefined}
                    role={conv.user_id ? 'button' : undefined}
                  >
                    {displayName(conv).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn('text-xs font-medium truncate', isActive ? 'text-emerald-400' : 'text-foreground/80')}>
                        {displayName(conv)}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {unread > 0 && (
                          <span className="h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                        {/* ⋯ More button */}
                        <button
                          className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-foreground/[0.08] transition-all"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : conv.id); }}
                        >
                          <MoreHorizontal size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] truncate mt-0.5">
                      {convTyping[conv.id] ? (
                        <span className="text-emerald-400 italic flex items-center gap-1">
                          <span className="flex gap-0.5">
                            {[0,150,300].map((d) => (
                              <span key={d} className="h-1 w-1 rounded-full bg-emerald-400 animate-bounce inline-block"
                                style={{ animationDelay: `${d}ms` }} />
                            ))}
                          </span>
                          {t('chat.typing')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">{conv.visitor_email || conv.user?.email || ''}</span>
                      )}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={cn('inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-medium', STATUS_CONFIG[conv.status].color)}>
                        <Circle size={5} className="fill-current" />
                        {t(`chat.status.${conv.status}`)}
                      </span>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-muted-foreground/40">
                          {new Date(conv.last_message_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ⋯ Dropdown menu */}
                  {menuOpen && (
                    <div
                      className="absolute right-2 top-10 z-20 w-44 rounded-xl border border-admin-border bg-admin-surface shadow-xl overflow-hidden fade-scale-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(conv.unread_admin > 0 || (unreadMap[conv.id] ?? 0) > 0) ? (
                        <button
                          onClick={async () => { await markRead(conv.id); setOpenMenuId(null); }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-foreground/70 hover:bg-foreground/[0.05] transition-colors"
                        >
                          <CheckCheck size={13} className="text-emerald-400" />
                          {t('chat.markRead')}
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            await markUnread(conv.id);
                            setUnreadMap((p) => ({ ...p, [conv.id]: 1 }));
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-foreground/70 hover:bg-foreground/[0.05] transition-colors"
                        >
                          <MessageCircle size={13} className="text-amber-400" />
                          {t('chat.markUnread')}
                        </button>
                      )}
                      {conv.status !== 'closed' && (
                        <button
                          onClick={async () => { await updateStatus({ id: conv.id, status: 'closed' }); setOpenMenuId(null); }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-foreground/70 hover:bg-foreground/[0.05] transition-colors"
                        >
                          <CheckCircle size={13} /> {t('chat.closeConv')}
                        </button>
                      )}
                      {conv.status === 'closed' && (
                        <button
                          onClick={async () => { await updateStatus({ id: conv.id, status: 'open' }); setOpenMenuId(null); }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-foreground/70 hover:bg-foreground/[0.05] transition-colors"
                        >
                          <Clock size={13} /> {t('chat.reopen')}
                        </button>
                      )}
                      <div className="border-t border-admin-border" />
                      <button
                        onClick={async () => {
                          if (!confirm(t('chat.confirmDeleteConv'))) return;
                          try {
                            await deleteConversation(conv.id).unwrap();
                            if (activeConvId === conv.id) setActiveConvId(null);
                          } catch { toast.error(t('chat.delete') + ' thất bại'); }
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={13} /> {t('chat.delete')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: Message View ── mobile: ẩn khi chưa chọn conv */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0',
        !activeConvId ? 'hidden md:flex' : 'flex',   /* mobile: ẩn placeholder, hiện khi có conv */
      )}>
        {!activeConvId ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <MessageCircle size={28} className="text-emerald-400/60" />
            </div>
            <p className="text-sm text-muted-foreground">{t('chat.selectConversation')}</p>
          </div>
        ) : (
          <>
            {/* Conv header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-admin-border bg-admin-surface flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button — chỉ hiện trên mobile */}
                <button
                  onClick={() => setActiveConvId(null)}
                  className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/[0.06] transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #059669, #0891b2)', cursor: activeConv?.user_id ? 'pointer' : 'default' }}
                  onClick={() => activeConv?.user_id && navigate(`/admin/users?highlight=${activeConv.user_id}`)}
                  title={activeConv?.user_id ? t('chat.viewProfile') : undefined}
                >
                  {activeConv ? displayName(activeConv).charAt(0).toUpperCase() : 'K'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{activeConv ? displayName(activeConv) : ''}</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {activeConv?.visitor_email || activeConv?.user?.email || ''}
                    {activeConv?.created_at && ` · ${formatDateTime(activeConv.created_at)}`}
                  </p>
                </div>
              </div>
              {/* Status actions */}
              <div className="flex items-center gap-2">
                {activeConv?.status !== 'closed' && (
                  <button onClick={() => updateStatus({ id: activeConvId, status: 'closed' })}
                    className="flex items-center gap-1.5 rounded-lg border border-foreground/[0.10] px-3 py-1.5 text-xs text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground transition-colors">
                    <CheckCircle size={12} /> {t('chat.close')}
                  </button>
                )}
                {activeConv?.status === 'closed' && (
                  <button onClick={() => updateStatus({ id: activeConvId, status: 'open' })}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                    <Clock size={12} /> {t('chat.reopen')}
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!confirm(t('chat.confirmDeleteConv'))) return;
                    try {
                      await deleteConversation(activeConvId).unwrap();
                      setActiveConvId(null);
                    } catch { toast.error(t('chat.delete') + ' thất bại'); }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  title={t('chat.delete')}
                >
                  <Trash2 size={13} />
                </button>
                <button onClick={() => setActiveConvId(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/[0.06] transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {allMessages.map((msg) => {
                const isAdmin = msg.sender_type === 'admin';
                const canRecall = isAdmin && !msg.is_recalled &&
                  Date.now() - new Date(msg.created_at).getTime() < 10 * 60 * 1000; // 10 phút cho admin
                return (
                  <div key={msg.id} className={cn('flex gap-3 group/amsg', isAdmin && 'flex-row-reverse')}>
                    <div className={cn(
                      'h-8 w-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold',
                      isAdmin ? 'text-white' : 'bg-foreground/[0.08] text-foreground/70',
                    )}
                      style={isAdmin ? { background: 'linear-gradient(135deg, #059669, #0891b2)' } : {}}>
                      {isAdmin ? <Bot size={14} /> : <User size={13} />}
                    </div>
                    <div className={cn('max-w-[65%] relative', isAdmin && 'items-end flex flex-col')}>
                      <div className={cn(
                        'px-4 py-2.5 text-sm leading-relaxed rounded-2xl',
                        msg.is_recalled
                          ? 'bg-foreground/[0.04] border border-admin-border text-muted-foreground/60 italic text-xs'
                          : isAdmin
                            ? 'text-white rounded-tr-sm'
                            : 'bg-admin-surface text-foreground border border-admin-border rounded-tl-sm',
                      )}
                        style={!msg.is_recalled && isAdmin ? { background: 'linear-gradient(135deg, #059669, #0891b2)' } : {}}>
                        {msg.is_recalled ? t('chat.recalled') : msg.content}
                      </div>
                      {canRecall && activeConvId && (
                        <button
                          onClick={() => adminRecall({ convId: activeConvId, msgId: msg.id })}
                          className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover/amsg:opacity-100 transition-opacity h-6 w-6 flex items-center justify-center rounded-full bg-foreground/[0.06] border border-admin-border text-muted-foreground hover:text-red-400 text-[10px]"
                          title="Thu hồi"
                        >↩</button>
                      )}
                      <p className="text-[10px] text-muted-foreground/50 mt-1 mx-1 flex items-center gap-1">
                        {msg.sender_name} · {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        {/* ✓ / ✓✓ cho admin messages */}
                        {isAdmin && !msg.is_recalled && (
                          <span
                            className={cn(
                              'ml-0.5 text-[11px] font-medium transition-colors',
                              msg.is_read ? 'text-emerald-400' : 'text-muted-foreground/40',
                            )}
                            title={msg.is_read ? t('chat.readStatus') : t('chat.sentStatus')}
                          >
                            {msg.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
              {/* Typing indicator trong message view */}
              {convTyping[activeConvId] && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold bg-foreground/[0.08] text-foreground/70">
                    <User size={13} />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-admin-surface border border-admin-border flex items-center gap-1" title={t('chat.typing')}>
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce inline-block"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            {activeConv?.status !== 'closed' ? (
              <div className="px-4 py-3 border-t border-admin-border bg-admin-surface flex items-center gap-3 flex-shrink-0">
                <input
                  value={reply}
                  onChange={(e) => {
                    setReply(e.target.value);
                    const socket = socketRef.current;
                    if (!socket || !activeConvId) return;
                    socket.emit('chat:typing', { conversationId: activeConvId, typing: true, senderType: 'admin' });
                    if (adminTypingTimer.current) clearTimeout(adminTypingTimer.current);
                    adminTypingTimer.current = setTimeout(() => {
                      socket.emit('chat:typing', { conversationId: activeConvId, typing: false, senderType: 'admin' });
                    }, 1500);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                  placeholder={t('chat.replyPlaceholder')}
                  className="flex-1 rounded-xl border border-admin-border bg-foreground/[0.03] px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-border/60 transition-colors"
                  autoFocus
                />
                <button onClick={handleReply} disabled={!reply.trim() || isReplying}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white transition-all hover:scale-105 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
                  {isReplying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            ) : (
              <div className="px-4 py-3 border-t border-admin-border bg-admin-surface text-center">
                <p className="text-xs text-muted-foreground/60">{t('chat.conversationClosed')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
