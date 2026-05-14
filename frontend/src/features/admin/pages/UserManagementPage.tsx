import { useState, useEffect } from 'react';
import { X, Search, Users, ShieldOff, Shield, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminPagination } from '../components/AdminPagination';
import { useGetAdminUsersQuery, useToggleBanUserMutation, useGetUserDetailQuery } from '../services/adminApi';
import { formatDate } from '../../../shared/utils/formatDate';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { cn } from '../../../shared/utils/cn';
import { toast } from 'sonner';

interface User {
  id: number; email: string; full_name: string; role: string;
  is_active: boolean; email_verified: boolean; created_at: string;
}

const AVATAR_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];

function UserDetailDrawer({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { t } = useTranslation('admin');
  // Khóa scroll của main content khi drawer mở
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  const { data, isLoading } = useGetUserDetailQuery(userId);
  const detail = data?.data as { user: User; bookings: unknown[]; stats: { totalBookings: number; confirmedBookings: number; totalSpent: number } } | undefined;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-admin-border bg-admin-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">{t('users.drawer.title')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground/80">
            <X size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-foreground/[0.03] animate-pulse" />)}
          </div>
        ) : detail ? (
          <div className="p-5 space-y-6">
            {/* Avatar + info */}
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white flex-shrink-0',
                AVATAR_COLORS[detail.user.id % AVATAR_COLORS.length],
              )}>
                {detail.user.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">{detail.user.full_name}</p>
                <p className="text-sm text-muted-foreground">{detail.user.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    detail.user.is_active ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-400',
                  )}>
                    {detail.user.is_active ? t('users.drawer.statusActive') : t('users.drawer.statusBanned')}
                  </span>
                  {detail.user.email_verified && (
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                      {t('users.drawer.emailVerified')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('users.drawer.stats.totalBookings'), value: detail.stats.totalBookings },
                { label: t('users.drawer.stats.confirmed'), value: detail.stats.confirmedBookings },
                { label: t('users.drawer.stats.spent'), value: formatCurrency(detail.stats.totalSpent), small: true },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-admin-border bg-foreground/[0.02] p-3 text-center">
                  <p className={cn('font-bold text-foreground', s.small ? 'text-sm' : 'text-xl')}>{s.value}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{t('users.drawer.info.title')}</p>
              {[
                { label: t('users.drawer.info.createdAt'), value: formatDate(detail.user.created_at) },
                { label: t('users.drawer.info.role'), value: detail.user.role === 'admin' ? t('users.role.admin') : t('users.role.customer') },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between rounded-xl border border-foreground/[0.05] bg-foreground/[0.02] px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">{r.label}</span>
                  <span className="text-xs font-medium text-foreground/80">{r.value}</span>
                </div>
              ))}
            </div>

            {/* Recent bookings */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{t('users.drawer.recentBookings.title')}</p>
              {(detail.bookings as Array<{
                id: number; status: string; total_amount: number; created_at: string;
                event?: { title: string };
              }>).slice(0, 8).map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-xl border border-foreground/[0.05] bg-foreground/[0.02] px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium text-foreground/80">{b.event?.title ?? '—'}</p>
                    <p className="text-[10px] text-muted-foreground/60">{formatDate(b.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-foreground">{formatCurrency(Number(b.total_amount))}</p>
                    <span className={cn(
                      'text-[10px] font-medium',
                      b.status === 'confirmed' ? 'text-primary' : b.status === 'expired' ? 'text-muted-foreground' : 'text-red-400',
                    )}>
                      {b.status === 'confirmed' ? t('users.drawer.recentBookings.status.confirmed') : b.status === 'expired' ? t('users.drawer.recentBookings.status.expired') : b.status}
                    </span>
                  </div>
                </div>
              ))}
              {detail.bookings.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground/60">{t('users.drawer.recentBookings.empty')}</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function UserManagementPage() {
  const { t } = useTranslation('admin');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useGetAdminUsersQuery({ page, limit: 10, ...(search && { search }) });
  const [toggleBan] = useToggleBanUserMutation();

  const users = (data?.data ?? []) as User[];
  const pagination = data?.pagination;

  const handleBan = async (id: number, isActive: boolean) => {
    try {
      await toggleBan(id).unwrap();
      toast.success(isActive ? t('users.toast.banSuccess') : t('users.toast.unbanSuccess'));
      refetch();
    } catch { toast.error(t('users.toast.error')); }
  };

  return (
    <div className="space-y-5">
      {selectedId && <UserDetailDrawer userId={selectedId} onClose={() => setSelectedId(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('users.title')}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('users.subtitle', { total: pagination?.total ?? 0 })}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('users.searchPlaceholder')}
          className="w-full rounded-xl border border-admin-border bg-foreground/[0.03] py-2 pl-8 pr-3 text-sm text-foreground/80 outline-none placeholder:text-muted-foreground/60 focus:border-border/60 transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-foreground/[0.03] animate-pulse" />)}
        </div>
      ) : (
        <div className="admin-chart-card p-0">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-foreground/[0.05]">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{t('users.columns.user')}</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 hidden md:table-cell">{t('users.columns.createdAt')}</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{t('users.columns.status')}</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{t('users.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  className={cn('group border-b border-foreground/[0.04] hover:bg-foreground/[0.025] transition-colors cursor-pointer', i === users.length - 1 && 'border-b-0')}
                  onClick={() => setSelectedId(u.id)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', AVATAR_COLORS[u.id % AVATAR_COLORS.length])}>
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      {u.role === 'admin' && (
                        <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400 border border-violet-500/20">Admin</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-xs text-muted-foreground">{formatDate(u.created_at)}</p>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border',
                      u.is_active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-red-500/10 text-red-400 border-red-500/20',
                    )}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', u.is_active ? 'bg-success' : 'bg-error')} />
                      {u.is_active ? t('users.status.active') : t('users.status.banned')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedId(u.id)}
                        className="rounded-lg p-1.5 text-muted-foreground/60 hover:bg-foreground/[0.06] hover:text-foreground/80 transition-colors"
                        title={t('users.actions.viewDetail')}
                      >
                        <ChevronRight size={14} />
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleBan(u.id, u.is_active)}
                          className={cn(
                            'rounded-lg p-1.5 transition-colors',
                            u.is_active
                              ? 'text-muted-foreground/60 hover:bg-red-500/10 hover:text-error'
                              : 'text-muted-foreground/60 hover:bg-primary/10 hover:text-primary',
                          )}
                          title={u.is_active ? t('users.actions.ban') : t('users.actions.unban')}
                        >
                          {u.is_active ? <ShieldOff size={14} /> : <Shield size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>{/* overflow-x-auto */}
          {users.length === 0 && (
            <div className="flex flex-col items-center py-16">
              <Users size={36} className="text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">{t('users.empty')}</p>
            </div>
          )}
        </div>
      )}

      {pagination && (
        <AdminPagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
