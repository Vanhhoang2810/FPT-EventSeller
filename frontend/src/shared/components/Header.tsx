import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import { Bell, Search, LayoutDashboard, LogOut, User, Ticket, Heart, CheckCheck, Sun, Moon, Menu, X, Calendar, Info, HelpCircle, Home, type LucideIcon } from 'lucide-react';
import { useThemeToggle } from '../hooks/useThemeToggle';
import { useTranslation } from 'react-i18next';
import { selectCurrentUser, selectIsAuthenticated, clearCredentials } from '../../features/auth/store/authSlice';
import { broadcastAuth } from '../../app/SessionProvider';
import type { RootState } from '../../app/store';
import { ROUTES } from '../constants/routes';
import { Logo } from './Logo';
import { cn } from '../utils/cn';
import { formatRelativeTime } from '../utils/formatDate';
import {
  useGetUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
} from '../../features/notifications/services/notificationsApi';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useSocket } from '../hooks/useSocket';
import { apiSlice } from '../../app/api';
import { useGetEventSuggestionsQuery } from '../../features/events/services/eventsApi';
import { useDebounce } from '../hooks/useDebounce';

/** Search bar nhỏ gọn dùng trong header — có autocomplete suggest */
function HeaderSearchBar({ onClose, onSearch }: { onClose: () => void; onSearch: (q: string) => void }) {
  const { t } = useTranslation('common');
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQ = useDebounce(q, 280);
  const { data: suggestions } = useGetEventSuggestionsQuery(debouncedQ, { skip: debouncedQ.length < 2 });
  const results = suggestions?.data ?? [];
  const showDropdown = debouncedQ.length >= 2 && results.length > 0;

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card/90 backdrop-blur-sm px-2.5 py-1.5 shadow-sm">
        <Search size={14} className="flex-shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && q.trim()) onSearch(q.trim());
            if (e.key === 'Escape') onClose();
          }}
          onBlur={() => setTimeout(onClose, 200)}
          placeholder={t('aria.searchEvents')}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
        />
        <button onClick={onClose} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <X size={14} />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {results.slice(0, 6).map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.slug}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSearch(event.title); }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-secondary transition-colors"
            >
              {event.thumbnail_url && (
                <img src={event.thumbnail_url} alt="" className="h-9 w-14 flex-shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.venue?.name}</p>
              </div>
            </Link>
          ))}
          {q.trim() && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSearch(q.trim())}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-xs text-primary-600 hover:bg-secondary transition-colors"
            >
              <Search size={12} /> {t('aria.searchAllResults', { query: q })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector((s: RootState) => s.auth.isLoading);
  const { theme, toggle: toggleTheme } = useThemeToggle();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dispatch = useDispatch();

  // Đóng tất cả dropdowns khi click ngoài
  useEffect(() => {
    const handler = () => { setDropdownOpen(false); setNotifOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
  const navigate = useNavigate();

  const { data: unreadData } = useGetUnreadCountQuery(undefined, { skip: !isAuthenticated, pollingInterval: 60000 });
  const { data: notifData } = useGetNotificationsQuery(undefined, { skip: !notifOpen || !isAuthenticated });
  const [markRead] = useMarkReadMutation();
  const [markAllRead] = useMarkAllReadMutation();
  const unreadCount = unreadData?.data?.count ?? 0;
  const notifications = notifData?.data ?? [];

  // WebSocket real-time: join user room + invalidate cache khi có notification mới
  const socketRef = useSocket();
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const socket = socketRef.current;
    if (!socket) return;

    const joinRoom = () => socket.emit('join:user', user.id);
    if (socket.connected) joinRoom();
    else socket.once('connect', joinRoom);

    const handleNewNotification = () => {
      dispatch(apiSlice.util.invalidateTags(['Notification']));
    };
    socket.on('notification:new', handleNewNotification);

    return () => {
      // Leave user room khi logout hoặc user thay đổi — tránh nhận notification sai user
      if (socket.connected) socket.emit('leave:user', user?.id);
      socket.off('notification:new', handleNewNotification);
    };
  }, [isAuthenticated, user?.id, socketRef, dispatch]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      broadcastAuth('logout');
      dispatch(clearCredentials());
      navigate(ROUTES.HOME);
    }
  };

  const NAV_LINKS: Array<{ to: string; label: string; icon: LucideIcon }> = [
    { to: ROUTES.HOME, label: t('nav.home'), icon: Home },
    { to: ROUTES.EVENTS, label: t('nav.events'), icon: Calendar },
    { to: ROUTES.MY_TICKETS, label: t('nav.myTickets'), icon: Ticket },
    { to: ROUTES.ABOUT, label: t('nav.about'), icon: Info },
    { to: ROUTES.FAQ, label: t('nav.faq'), icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      {/* Mobile drawer — render via portal ra document.body để tránh backdrop-blur tạo containing block */}
      {mobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[200] md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <nav
            className="absolute right-0 top-0 h-full w-72 border-l border-border bg-card flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex h-16 items-center justify-between px-5 border-b border-border">
              <Logo size="sm" onClick={() => setMobileMenuOpen(false)} />
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            {/* Nav links */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to || (to !== ROUTES.HOME && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                      isActive ? 'bg-secondary text-foreground' : 'text-foreground/70 hover:bg-secondary hover:text-foreground',
                    )}
                  >
                    <Icon size={16} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                    {label}
                  </Link>
                );
              })}
              {/* Language switcher trong mobile drawer — cùng style với nav links */}
              <LanguageSwitcher className="w-full justify-start rounded-xl px-3 py-3 text-sm gap-3 text-foreground/70 icon-glass" />
              {/* Theme toggle trong drawer */}
              <button
                onClick={() => toggleTheme()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground/70 btn-glass transition-colors"
              >
                {theme === 'dark' ? <Sun size={16} className="text-muted-foreground" /> : <Moon size={16} className="text-muted-foreground" />}
                {theme === 'dark' ? t('theme.toggleLight') : t('theme.toggleDark')}
              </button>
            </div>
            {/* Auth actions in drawer */}
            {!isAuthenticated && (
              <div className="border-t border-border p-4 space-y-2">
                <Link to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground icon-glass transition-colors">
                  {t('nav.login')}
                </Link>
                <Link to={ROUTES.REGISTER} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center rounded-xl btn-glass py-2.5 text-sm font-semibold hover: transition-colors">
                  {t('nav.register')}
                </Link>
              </div>
            )}
            {isAuthenticated && user && (
              <div className="border-t border-border p-4">
                <div className="mb-3 flex items-center gap-3 rounded-xl bg-secondary px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full btn-glass text-sm font-semibold">
                    {user.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{user.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                >
                  {t("nav.logout")} <LogOut size={14} />
                </button>
              </div>
            )}
          </nav>
        </div>,
        document.body
      )}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo — luôn bên trái */}
        <Logo />

        {/* Nav links — desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to || (to !== ROUTES.HOME && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                title={label}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  isActive
                    ? 'font-semibold text-primary-700 dark:text-primary-300 bg-primary-500/10 border border-primary-500/25 backdrop-blur-sm'
                    : 'text-muted-foreground border border-transparent hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-500/8 hover:border-primary-500/20 hover:backdrop-blur-sm',
                )}
              >
                <Icon size={14} className="flex-shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Header search với suggest — dùng lại EventSearchBar logic */}
          <div className="hidden md:flex items-center">
            {searchOpen ? (
              <div className="w-64 relative">
                <HeaderSearchBar
                  onClose={() => { setSearchOpen(false); setSearchQuery(''); }}
                  onSearch={(q) => { navigate(`/events?search=${encodeURIComponent(q)}`); setSearchOpen(false); setSearchQuery(''); }}
                />
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="rounded-lg p-2 text-muted-foreground transition-colors icon-glass"
                aria-label={t("aria.searchEvents")}
              >
                <Search size={17} />
              </button>
            )}
          </div>
          {/* Theme toggle */}
          <button
            onClick={() => toggleTheme()}
            className="hidden rounded-lg p-2 text-muted-foreground transition-colors icon-glass md:block"
            title={theme === "dark" ? t("theme.toggleLight") : t("theme.toggleDark")}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {/* Language */}
          <LanguageSwitcher className="hidden md:flex" />

          {isLoading ? (
            // Đang restore session — không hiện gì để tránh flicker
            <div className="h-8 w-8 rounded-full bg-secondary animate-pulse" />
          ) : isAuthenticated ? (
            <>
              {/* Admin button */}
              {user?.role === 'admin' && (
                <Link
                  to={ROUTES.ADMIN}
                  className="hidden items-center gap-1.5 rounded-lg bg-primary-600/10 px-3 py-1.5 text-sm font-medium text-primary-400 transition-colors hover:bg-primary-600/20 md:flex"
                >
                  <LayoutDashboard size={14} />
                  {t("nav.admin")}
                </Link>
              )}

              {/* Notification bell + dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setDropdownOpen(false); setNotifOpen((p) => !p); }}
                  className="relative rounded-lg p-2 text-muted-foreground transition-colors icon-glass"
                  aria-label={t('aria.notifications')}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-border bg-card shadow-xl">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <span className="text-sm font-semibold text-foreground">{t('notifications.title')}</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllRead().then(() => setNotifOpen(false))}
                          className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                        >
                          <CheckCheck size={12} /> {t('notifications.markAllRead')}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          {t('notifications.empty')}
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.is_read) markRead(n.id);
                              setNotifOpen(false);
                              if (n.link) navigate(n.link);
                            }}
                            className={cn(
                              'cursor-pointer border-b border-border px-4 py-3 hover:bg-secondary',
                              !n.is_read && 'border-l-2 border-l-primary-500',
                            )}
                          >
                            <p className={cn('text-sm', !n.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{n.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground/60">{formatRelativeTime(n.created_at)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User avatar dropdown — dùng state thay vì group-hover để tránh gap */}
              <div
                className="relative"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => {
                  if (closeTimer.current) clearTimeout(closeTimer.current);
                  setNotifOpen(false);
                  setDropdownOpen(true);
                }}
                onMouseLeave={() => {
                  closeTimer.current = setTimeout(() => setDropdownOpen(false), 150);
                }}
              >
                <button className="flex h-8 w-8 items-center justify-center rounded-full btn-glass text-sm font-semibold overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                  ) : (
                    user?.fullName?.charAt(0).toUpperCase()
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-border bg-card shadow-xl">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <Link to={ROUTES.PROFILE} onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground icon-glass">
                        <User size={14} /> {t('nav.profile')}
                      </Link>
                      <Link to={ROUTES.MY_TICKETS} onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground icon-glass">
                        <Ticket size={14} /> {t('nav.myTickets')}
                      </Link>
                      <Link to={ROUTES.FAVORITES} onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground icon-glass">
                        <Heart size={14} /> {t('nav.favorites')}
                      </Link>
                      {user?.role === 'admin' && (
                        <Link to={ROUTES.ADMIN} onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-primary-400 hover:bg-secondary">
                          <LayoutDashboard size={14} /> {t('nav.admin')}
                        </Link>
                      )}
                      <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-error hover:bg-secondary">
                        <LogOut size={14} /> {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to={ROUTES.LOGIN}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t('nav.login')}
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className={cn(
                  'rounded-lg btn-glass px-4 py-2 text-sm font-semibold',
                  'transition-all hover:bg-primary-700 hover:shadow-[0_0_20px_rgba(5,150,105,0.3)]',
                )}
              >
                {t('nav.register')}
              </Link>
            </div>
          )}

          {/* Hamburger — mobile only, bên phải */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground icon-glass transition-colors md:hidden"
            {...{"aria-label": t("aria.openMenu")}}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
