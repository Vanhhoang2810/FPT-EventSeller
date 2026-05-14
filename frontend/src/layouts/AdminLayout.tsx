import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard, Calendar, Users, BookOpen,
  Tag, Building2, FileText, Shield, LogOut,
  ChevronLeft, ChevronRight, Search, Menu, X,
  TrendingUp, Ticket, Sun, Moon, Bell, Zap,
  Settings, ChevronDown, MessageCircle,
} from 'lucide-react';
import { useThemeToggle } from '../shared/hooks/useThemeToggle';
import { LanguageSwitcher } from '../shared/components/LanguageSwitcher';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { selectCurrentUser, clearCredentials } from '../features/auth/store/authSlice';
import { ROUTES } from '../shared/constants/routes';
import { Logo } from '../shared/components/Logo';
import { cn } from '../shared/utils/cn';
import { useGetDashboardQuery } from '../features/admin/services/adminApi';
import { broadcastAuth } from '../app/SessionProvider';
import { useGetUnreadCountQuery, useGetNotificationsQuery, useMarkAllReadMutation } from '../features/notifications/services/notificationsApi';
import { formatCurrency } from '../shared/utils/formatCurrency';
import { useSocket, getSocketInstance } from '../shared/hooks/useSocket';

type TFn = (key: string) => string;

const NAV_SECTIONS = [
  {
    labelKey: 'sections.overview',
    items: [
      { labelKey: 'nav.dashboard', icon: LayoutDashboard, href: ROUTES.ADMIN_DASHBOARD, color: 'text-emerald-400' },
    ],
  },
  {
    labelKey: 'sections.management',
    items: [
      { labelKey: 'nav.events',   icon: Calendar,   href: ROUTES.ADMIN_EVENTS,   color: 'text-blue-400' },
      { labelKey: 'nav.bookings', icon: BookOpen,   href: ROUTES.ADMIN_BOOKINGS, color: 'text-violet-400' },
      { labelKey: 'nav.users',    icon: Users,      href: ROUTES.ADMIN_USERS,    color: 'text-cyan-400' },
      { labelKey: 'nav.venues',   icon: Building2,  href: ROUTES.ADMIN_VENUES,   color: 'text-amber-400' },
      { labelKey: 'nav.promo',    icon: Tag,        href: ROUTES.ADMIN_PROMO,    color: 'text-rose-400' },
    ],
  },
  {
    labelKey: 'sections.analytics',
    items: [
      { labelKey: 'nav.reports', icon: FileText,       href: ROUTES.ADMIN_REPORTS, color: 'text-orange-400' },
      { labelKey: 'nav.audit',   icon: Shield,         href: ROUTES.ADMIN_AUDIT,   color: 'text-slate-400' },
      { labelKey: 'nav.chat',    icon: MessageCircle,  href: ROUTES.ADMIN_CHAT,    color: 'text-emerald-400' },
    ],
  },
];

function buildBreadcrumb(pathname: string, t: TFn) {
  const map: Record<string, string> = {
    '/admin': t('nav.dashboard'),
    '/admin/events': t('nav.events'),
    '/admin/events/create': t('events.create'),
    '/admin/bookings': t('nav.bookings'),
    '/admin/users': t('nav.users'),
    '/admin/venues': t('nav.venues'),
    '/admin/promo': t('nav.promo'),
    '/admin/reports': t('nav.reports'),
    '/admin/audit': t('nav.audit'),
    '/admin/chat':  t('nav.chat'),
  };
  // Luôn show 2 level: Admin / <Trang hiện tại>
  const currentLabel = map[pathname] ?? pathname.split('/').filter(Boolean).pop() ?? '';
  return [
    { label: 'Admin', href: '/admin' },
    ...(currentLabel ? [{ label: currentLabel, href: pathname }] : []),
  ];
}

// PAGE_TITLES đã xóa — breadcrumb dùng t() để hỗ trợ i18n

const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

export function AdminLayout() {
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const { theme, toggle: toggleTheme } = useThemeToggle();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [chatUnread, setChatUnread]     = useState(0);
  const [notifOpen, setNotifOpen]       = useState(false);
  const socketRef = useSocket();
  const isAuth = !!user;
  const searchRef = useRef<HTMLInputElement>(null);
  const crumbs    = buildBreadcrumb(location.pathname, t);
  // pageTitle không còn dùng — breadcrumb tự hiển thị

  const { data: dashData } = useGetDashboardQuery(undefined, {
    skip: collapsed,
    refetchOnMountOrArgChange: false,
  });
  const stats = dashData?.data;

  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    skip: !isAuth, pollingInterval: 60000,
  });
  const { data: notifData } = useGetNotificationsQuery(undefined, {
    skip: !isAuth || !notifOpen,
  });
  const [markAllRead] = useMarkAllReadMutation();
  const unreadCount   = unreadData?.data?.count ?? 0;
  const notifications = notifData?.data ?? [];

  const filteredNavItems = ALL_NAV_ITEMS.filter((item) => {
    const label = t(item.labelKey).toLowerCase();
    return label.includes(searchQuery.toLowerCase()) || item.href.includes(searchQuery.toLowerCase());
  });

  const openPalette = useCallback(() => {
    setSearchOpen(true); setSearchQuery(''); setHighlightIdx(0);
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);
  const closePalette = useCallback(() => { setSearchOpen(false); setSearchQuery(''); }, []);

  // Responsive sidebar: auto-collapse theo viewport
  useEffect(() => {
    const MOBILE_BP = 640;   // < 640px → hamburger
    const COLLAPSE_BP = 1280; // < 1280px → icon rail

    const handleResize = () => {
      const w = window.innerWidth;
      if (w < MOBILE_BP) {
        setMobileOpen(false);
      } else if (w < COLLAPSE_BP) {
        setCollapsed(true);
        setMobileOpen(false);
      } else {
        setCollapsed(false);
        setMobileOpen(false);
      }
    };

    handleResize(); // chạy ngay khi mount để set trạng thái đúng
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Badge chat unread — dùng getSocketInstance() để tránh null ref race
  useEffect(() => {
    // Retry tối đa 10 lần x 300ms nếu socket chưa sẵn sàng
    let retries = 0;
    let cleanup: (() => void) | null = null;

    const setup = () => {
      const socket = getSocketInstance() || socketRef.current;
      if (!socket) {
        if (retries++ < 10) setTimeout(setup, 300);
        return;
      }

      const join = () => socket.emit('join:admin');
      if (socket.connected) join();
      else socket.once('connect', join);

      const onNewConv = () => setChatUnread((n) => n + 1);
      const onMsg = (data: { message: { sender_type: string } }) => {
        if (data.message.sender_type !== 'admin') setChatUnread((n) => n + 1);
      };

      socket.on('chat:new_conversation', onNewConv);
      socket.on('chat:message', onMsg);

      cleanup = () => {
        socket.off('chat:new_conversation', onNewConv);
        socket.off('chat:message', onMsg);
      };
    };

    setup();
    return () => { cleanup?.(); };
  }, [socketRef]);

  // Clear badge khi vào trang chat
  useEffect(() => {
    if (location.pathname.startsWith('/admin/chat')) {
      setChatUnread(0);
    }
  }, [location.pathname]);

  // Đóng notification dropdown khi click ngoài
  useEffect(() => {
    if (!notifOpen) return;
    const handler = () => setNotifOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [notifOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openPalette(); return; }
      if (!searchOpen) return;
      if (e.key === 'Escape') { closePalette(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx((p) => Math.min(p + 1, filteredNavItems.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlightIdx((p) => Math.max(p - 1, 0)); return; }
      if (e.key === 'Enter' && filteredNavItems[highlightIdx]) { navigate(filteredNavItems[highlightIdx].href); closePalette(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, filteredNavItems, highlightIdx, navigate, openPalette, closePalette]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    broadcastAuth('logout'); // notify các tab khác
    dispatch(clearCredentials());
    navigate(ROUTES.HOME);
  };

  const initials = user?.fullName?.split(' ').slice(-1)[0]?.charAt(0).toUpperCase() ?? 'A';

  /* ── SIDEBAR CONTENT ── */
  const renderSidebar = (onNavClick?: () => void) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.labelKey}>
            {!collapsed && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3))' }} />
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] flex-shrink-0 gradient-text">
                  {t(section.labelKey)}
                </span>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(249,115,22,0.3), transparent)' }} />
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ labelKey, icon: Icon, href, color }) => {
                const isActive = href === ROUTES.ADMIN_DASHBOARD
                  ? location.pathname === href
                  : location.pathname.startsWith(href);
                return (
                  <Link key={href} to={href}
                    title={collapsed ? t(labelKey) : undefined}
                    onClick={onNavClick}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                      'border border-transparent',
                      isActive
                        ? theme === 'light'
                          ? 'bg-emerald-500/[0.12] border-emerald-500/[0.30] text-emerald-800 font-semibold'
                          : 'bg-white/[0.10] border-white/[0.12] text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                        : theme === 'light'
                          ? 'text-slate-600 hover:text-slate-900 hover:bg-emerald-500/[0.06] hover:border-emerald-500/[0.15]'
                          : 'text-white/55 hover:text-white/90 hover:bg-white/[0.06] hover:border-white/[0.07]',
                      collapsed && 'justify-center px-2',
                    )}
                  >
                    {/* Active left accent bar */}
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                    )}
                    {/* Icon với màu riêng */}
                    <span className={cn(
                      'flex-shrink-0 transition-transform duration-150 group-hover:scale-110',
                      isActive ? 'text-emerald-400' : color,
                    )}>
                      <Icon size={16} />
                    </span>
                    {!collapsed && (
                      <span className="flex-1 truncate">{t(labelKey)}</span>
                    )}
                    {/* Chat unread badge */}
                    {href === ROUTES.ADMIN_CHAT && chatUnread > 0 && (
                      <span className={cn(
                        'flex-shrink-0 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center border border-[#09090B]',
                        collapsed ? 'h-4 w-4 absolute top-1 right-1' : 'h-4 min-w-[16px] px-0.5 ml-auto',
                      )}>
                        {chatUnread > 9 ? '9+' : chatUnread}
                      </span>
                    )}
                    {isActive && !collapsed && chatUnread === 0 && (
                      <span className="ml-auto flex-shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)] flex-shrink-0" />
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Mini stats widget */}
      {!collapsed && stats && (
        <div className="mx-3 mb-3">
          <div className="rounded-xl overflow-hidden" style={{
              border: '1px solid transparent',
              backgroundImage: theme === 'light'
                ? 'linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), linear-gradient(135deg, #10b981 0%, #f97316 100%)'
                : 'linear-gradient(rgba(9,9,11,0.7), rgba(9,9,11,0.7)), linear-gradient(135deg, #10b981 0%, #f97316 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
            }}>
            <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
              <Zap size={10} style={{ color: theme === 'light' ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.4)' }} />
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] gradient-text">{t('sidebar.liveStats')}</span>
            </div>
            <div className="px-3 pb-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] flex items-center gap-1.5"
                  style={{ color: theme === 'light' ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.45)' }}>
                  <TrendingUp size={10} style={{ color: theme === 'light' ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.3)' }} />
                  {t('sidebar.today')}
                </span>
                <span className="text-[11px] font-bold gradient-text">{formatCurrency(stats.todayRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] flex items-center gap-1.5"
                  style={{ color: theme === 'light' ? 'rgba(15,23,42,0.50)' : 'rgba(255,255,255,0.50)' }}>
                  <Ticket size={10} style={{ color: theme === 'light' ? 'rgba(15,23,42,0.30)' : 'rgba(255,255,255,0.30)' }} />
                  {t('sidebar.confirmedOrders')}
                </span>
                <span className="text-[11px] font-semibold"
                  style={{ color: theme === 'light' ? 'rgba(15,23,42,0.80)' : 'rgba(255,255,255,0.75)' }}>
                  {stats.totalBookings}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="border-t border-white/[0.07] p-3">
        {!collapsed ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((p) => !p)}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border border-transparent hover:bg-white/[0.06] hover:border-white/[0.08] transition-all group"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-emerald-300 shadow-md border border-emerald-500/30 shadow-emerald-500/20" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(6,182,212,0.15) 100%)', backdropFilter: 'blur(12px)' }}>
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#09090B] shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="truncate text-xs font-semibold text-white/90 leading-tight">{user?.fullName}</p>
                <p className="truncate text-[10px] text-white/40 leading-tight mt-0.5">{user?.email}</p>
              </div>
              <ChevronDown size={12} className={cn('text-white/30 transition-transform flex-shrink-0', userMenuOpen && 'rotate-180')} />
            </button>
            {/* User dropdown — theme-aware */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl overflow-hidden fade-scale-in"
                style={{
                  background: theme === 'light' ? 'rgba(255,255,255,0.98)' : 'rgba(20,20,28,0.97)',
                  border: theme === 'light' ? '1px solid rgba(15,23,42,0.10)' : '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: theme === 'light'
                    ? '0 -4px 16px rgba(15,23,42,0.10)'
                    : '0 -8px 32px rgba(0,0,0,0.5)',
                }}>
                <div className="p-1">
                  <Link to="/profile"
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                      theme === 'light'
                        ? 'text-slate-600 hover:bg-emerald-500/[0.08] hover:text-slate-900'
                        : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
                    )}
                    onClick={() => setUserMenuOpen(false)}>
                    <Settings size={13} /> {t('sidebar.settings')}
                  </Link>
                  <button onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-colors">
                    <LogOut size={13} /> {tCommon('nav.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Collapsed: chỉ avatar */
          <div className="flex flex-col items-center gap-2">
            <button className="relative group">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-emerald-300 border border-emerald-500/30"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(6,182,212,0.15) 100%)', backdropFilter: 'blur(12px)' }}>
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-[#09090B]" />
            </button>
            <button onClick={() => navigate('/profile')} title={t('sidebar.settings')}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.08] hover:text-white/80 transition-colors">
              <Settings size={13} />
            </button>
            <button onClick={handleLogout} title={tCommon('nav.logout')}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors">
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /* ── SIDEBAR SHELL ── */
  const sidebarShell = (children: React.ReactNode, onClose?: () => void) => (
    <div className="flex flex-col h-full admin-sidebar-bg">
      {/* Logo header */}
      <div className={cn(
        'flex h-16 flex-shrink-0 items-center border-b border-white/[0.07] px-4',
        collapsed && !onClose ? 'justify-center' : 'justify-between',
      )}
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.22) 0%, rgba(6,182,212,0.10) 60%, rgba(16,185,129,0.08) 100%)', borderBottom: '1px solid rgba(16,185,129,0.15)' }}
      >
        {(!collapsed || onClose) && <Logo size="sm" />}
        {onClose ? (
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-colors">
            <X size={16} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col border-r border-white/[0.06] slide-in-right overflow-hidden">
            {sidebarShell(renderSidebar(() => setMobileOpen(false)), () => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={cn(
          'hidden sm:block border-r border-white/[0.06] flex-shrink-0',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-[64px]' : 'w-[232px]',
        )}
      >
        <div className="sticky top-0 h-screen">
          {sidebarShell(renderSidebar())}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* ── HEADER ── */}
        <header
          className="admin-topbar sticky top-0 z-40 flex h-[56px] flex-shrink-0 items-center justify-between px-5 gap-4"
          style={{
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          {/* Left: hamburger + page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="sm:hidden flex h-8 w-8 items-center justify-center rounded-lg text-foreground/50 hover:text-foreground hover:bg-foreground/[0.07] transition-colors"
            >
              <Menu size={16} />
            </button>

            {/* Breadcrumb — theme-aware colors */}
            <nav className="flex items-center gap-1.5 text-xs text-foreground/50 min-w-0">
              {crumbs.map((c, i) => (
                <span key={c.href} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && <span className="text-foreground/25 flex-shrink-0">/</span>}
                  {i === crumbs.length - 1 ? (
                    <span className="text-foreground/80 font-semibold truncate">{c.label}</span>
                  ) : (
                    <Link to={c.href} className="text-foreground/45 hover:text-foreground/70 transition-colors flex-shrink-0">{c.label}</Link>
                  )}
                </span>
              ))}
            </nav>
          </div>

          {/* Right: actions group — dùng text-foreground/x để hoạt động cả dark lẫn light */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Search trigger */}
            <button
              onClick={openPalette}
              className="hidden sm:flex items-center gap-2.5 h-8 rounded-lg border border-foreground/[0.10] bg-foreground/[0.04] px-3 text-xs text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.07] hover:border-foreground/[0.15] transition-all"
            >
              <Search size={12} className="text-foreground/40" />
              <span>{t('search.placeholder')}</span>
              <kbd className="ml-1 hidden lg:inline-flex items-center rounded border border-foreground/[0.12] px-1 py-0.5 text-[9px] font-mono text-foreground/35">⌘K</kbd>
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-foreground/[0.10] mx-1 hidden sm:block" />

            {/* Theme toggle */}
            <button
              onClick={() => toggleTheme()}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.07] transition-all"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Language */}
            <LanguageSwitcher />

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((p) => !p)}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.07] transition-all"
                title="Thông báo"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center px-0.5 border border-background">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-border overflow-hidden shadow-xl fade-scale-in"
                  style={{ background: 'var(--card)' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">{t('chat.notifications')}</span>
                    {unreadCount > 0 && (
                      <button onClick={() => markAllRead()}
                        className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
                        {t('chat.readAllNotif')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-xs text-muted-foreground">{t('chat.noNotifications')}</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div key={n.id}
                          className={cn('flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-foreground/[0.03] transition-colors last:border-b-0',
                            !n.is_read && 'bg-emerald-500/[0.04]'
                          )}>
                          <div className={cn('mt-1 h-2 w-2 rounded-full flex-shrink-0',
                            n.is_read ? 'bg-transparent' : 'bg-emerald-400')} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground leading-tight">{n.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-foreground/[0.10] mx-1" />

            {/* Events quick action */}
            <Link
              to={ROUTES.ADMIN_EVENTS}
              className="hidden md:flex items-center gap-1.5 h-8 rounded-lg border border-foreground/[0.12] bg-foreground/[0.05] px-3 text-xs font-medium text-foreground/65 hover:bg-foreground/[0.09] hover:text-foreground/90 transition-all"
            >
              <Calendar size={12} />
              <span>{t('nav.events')}</span>
            </Link>

            {/* User avatar button */}
            <button
              onClick={() => navigate('/profile')}
              title={user?.fullName}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-emerald-300 border border-emerald-500/30 hover:scale-105 hover:border-emerald-400/50 transition-all ml-1" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.22) 0%, rgba(6,182,212,0.12) 100%)', backdropFilter: 'blur(12px)' }}
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Light mode header override */}
        <style>{`
          .light header[data-admin-header] {
            background: rgba(255,255,255,0.92) !important;
            border-bottom-color: rgba(15,23,42,0.08) !important;
            box-shadow: 0 1px 0 rgba(5,150,105,0.06), 0 2px 8px rgba(15,23,42,0.06) !important;
          }
          .light header[data-admin-header] h1,
          .light header[data-admin-header] button,
          .light header[data-admin-header] a { color: inherit; }
        `}</style>

        {/* Command palette — theme-aware */}
        {searchOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
            style={{
              background: theme === 'light' ? 'rgba(15,23,42,0.40)' : 'rgba(5,5,10,0.75)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={closePalette}
          >
            <div
              className="w-full max-w-lg rounded-2xl overflow-hidden fade-scale-in border border-foreground/[0.10]"
              style={{
                background: theme === 'light' ? 'rgba(255,255,255,0.98)' : 'rgba(14,14,22,0.97)',
                backdropFilter: 'blur(32px)',
                boxShadow: theme === 'light'
                  ? '0 20px 60px rgba(15,23,42,0.15), 0 4px 16px rgba(15,23,42,0.08)'
                  : '0 40px 100px rgba(0,0,0,0.8)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-foreground/[0.07]">
                <Search size={15} className="text-emerald-500/70 flex-shrink-0" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setHighlightIdx(0); }}
                  placeholder={t('search.placeholder')}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
                />
                <kbd className="rounded-lg border border-foreground/[0.12] bg-foreground/[0.04] px-2 py-1 text-[10px] font-mono text-foreground/40">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto p-2">
                {filteredNavItems.length === 0 ? (
                  <div className="py-10 text-center">
                    <Search size={24} className="text-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-foreground/40">{t('search.noResults')}</p>
                  </div>
                ) : (
                  filteredNavItems.map(({ labelKey, icon: Icon, href, color }, idx) => (
                    <button
                      key={href}
                      onClick={() => { navigate(href); closePalette(); }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all text-left',
                        idx === highlightIdx
                          ? 'bg-emerald-500/15 border border-emerald-500/25 text-foreground'
                          : 'text-foreground/60 hover:bg-foreground/[0.05] hover:text-foreground/90',
                      )}
                    >
                      <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0',
                        idx === highlightIdx ? 'bg-emerald-500/15' : 'bg-foreground/[0.06]')}>
                        <Icon size={14} className={idx === highlightIdx ? 'text-emerald-500' : (color ?? 'text-foreground/40')} />
                      </span>
                      <span className="flex-1 font-medium">{t(labelKey)}</span>
                      <span className="text-[10px] text-foreground/30 font-mono bg-foreground/[0.04] rounded px-1.5 py-0.5">{href}</span>
                      {idx === highlightIdx && (
                        <kbd className="text-[10px] text-emerald-500/70 border border-emerald-500/25 rounded px-1.5 py-0.5 font-mono">↵</kbd>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer hint — i18n */}
              <div className="border-t border-foreground/[0.06] px-4 py-2.5 flex items-center gap-4">
                {([[`↵`, t('search.select')], [`↑↓`, t('search.move')], [`ESC`, t('search.close')]] as [string, string][]).map(([key, label]) => (
                  <span key={key} className="flex items-center gap-1.5 text-[10px] text-foreground/35">
                    <kbd className="rounded border border-foreground/[0.12] bg-foreground/[0.04] px-1.5 py-0.5 font-mono text-foreground/45">{key}</kbd>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 admin-main-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
