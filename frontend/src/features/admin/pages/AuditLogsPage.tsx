import { useState } from 'react';
import { Shield, User, Calendar, Package, Search, Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminPagination } from '../components/AdminPagination';
import { useGetAuditLogsQuery } from '../services/adminApi';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { cn } from '../../../shared/utils/cn';

const ACTION_CONFIG: Record<string, { color: string; bg: string; icon: typeof Shield; group: string }> = {
  create_event:        { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: Calendar, group: 'event' },
  update_event:        { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       icon: Calendar, group: 'event' },
  delete_event:        { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         icon: Calendar, group: 'event' },
  update_event_status: { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     icon: Calendar, group: 'event' },
  setup_zones:         { color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20',   icon: Package,  group: 'zone'  },
  refund_booking:      { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     icon: Package,  group: 'booking' },
  ban_user:            { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         icon: User,     group: 'user'  },
  unban_user:          { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: User,     group: 'user'  },
  create_venue:        { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       icon: Package,  group: 'venue' },
  update_venue:        { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       icon: Package,  group: 'venue' },
  delete_venue:        { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         icon: Package,  group: 'venue' },
};

// Labels được lấy qua t() bên trong component — hỗ trợ i18n
const ACTION_GROUP_KEYS = ['all', 'event', 'user', 'booking', 'venue', 'zone'] as const;

interface AuditLog {
  id: number; action: string; entity_type: string; entity_id: number;
  details: Record<string, unknown> | null; created_at: string;
  admin?: { email: string; full_name: string };
}

const AVATAR_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-cyan-500'];

export function AuditLogsPage() {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');

  // Pass search + action lên server — tránh client-side filter trên 1 page dữ liệu
  const actionFilter = groupFilter === 'all' ? undefined : groupFilter;
  const { data, isLoading } = useGetAuditLogsQuery({ page, limit: 20, search: search || undefined, action: actionFilter });
  const logs = (data?.data ?? []) as AuditLog[];
  const pagination = data?.pagination;

  return (
    <div className="admin-bg space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('auditLogs.title')}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('auditLogs.subtitle')}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-[11px] font-medium text-emerald-400">
          <Shield size={11} />
          {pagination?.total ?? logs.length} {t('auditLogs.records')}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('auditLogs.searchPlaceholder')}
            className="w-full rounded-xl border border-admin-border bg-foreground/[0.03] py-2 pl-8 pr-8 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-border/60 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Group filter chips */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-admin-border bg-foreground/[0.03] p-1">
          <Filter size={11} className="ml-2 text-muted-foreground/50 flex-shrink-0" />
          {ACTION_GROUP_KEYS.map((key) => (
            <button key={key} onClick={() => { setGroupFilter(key); setPage(1); }}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                groupFilter === key
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25'
                  : 'text-muted-foreground hover:text-foreground'
              )}>
              {t(`auditLogs.groups.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl skeleton" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-admin-border bg-foreground/[0.02] py-20 gap-3">
          <div className="h-14 w-14 rounded-2xl bg-foreground/[0.05] border border-foreground/[0.08] flex items-center justify-center">
            <Shield size={24} className="text-foreground/25" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {search || groupFilter !== 'all' ? t('auditLogs.noResults') : t('auditLogs.empty')}
          </p>
          {(search || groupFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setGroupFilter('all'); }}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              <X size={11} /> {t('auditLogs.clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="admin-chart-card p-0">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{t('auditLogs.columns.admin')}</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{t('auditLogs.columns.action')}</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 hidden md:table-cell">{t('auditLogs.columns.entity')}</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 hidden lg:table-cell">{t('auditLogs.columns.details')}</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{t('auditLogs.columns.time')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const cfg    = ACTION_CONFIG[log.action];
                const Icon   = cfg?.icon ?? Shield;
                const adminId = log.admin ? (log.admin.email.length % AVATAR_COLORS.length) : 0;
                return (
                  <tr key={log.id} className={cn(
                    'border-b border-white/[0.04] transition-colors hover:bg-white/[0.025]',
                    i === logs.length - 1 && 'border-b-0',
                  )}>
                    {/* Admin */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-md', AVATAR_COLORS[adminId])}>
                          {log.admin?.full_name?.charAt(0).toUpperCase() ?? 'A'}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground leading-tight">{log.admin?.full_name}</p>
                          <p className="text-[10px] text-muted-foreground/55">{log.admin?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Action badge */}
                    <td className="px-5 py-3.5">
                      {cfg ? (
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium', cfg.color, cfg.bg)}>
                          <Icon size={11} />
                          {t(`auditLogs.actions.${log.action}`, { defaultValue: log.action })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono bg-foreground/[0.04] rounded px-1.5 py-0.5">{log.action}</span>
                      )}
                    </td>

                    {/* Entity */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="rounded-lg border border-admin-border bg-foreground/[0.03] px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                        {log.entity_type} <span className="text-foreground/50">#{log.entity_id}</span>
                      </span>
                    </td>

                    {/* Details */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {(() => {
                        if (!log.details) return null;
                        let parsed: Record<string, unknown>;
                        try { parsed = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details as Record<string, unknown>); }
                        catch { return null; }
                        const entries = Object.entries(parsed).slice(0, 2);
                        if (!entries.length) return null;
                        return (
                          <span className="text-[11px] text-muted-foreground/55 font-mono max-w-[200px] truncate block" title={JSON.stringify(parsed)}>
                            {entries.map(([k, v]) => (
                              <span key={k}>
                                <span className="text-muted-foreground/40">{k}:</span>{' '}
                                <span className="text-foreground/60">{String(v).slice(0, 20)}</span>
                                {' · '}
                              </span>
                            ))}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Time */}
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-[11px] text-muted-foreground/60 tabular-nums">{formatDateTime(log.created_at)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {pagination && (
        <AdminPagination page={page} totalPages={pagination.totalPages} total={pagination.total}
          label={t('auditLogs.paginationLabel')} onPageChange={setPage} />
      )}
    </div>
  );
}
