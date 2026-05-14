import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Plus, Edit, Eye, Trash2, Search, Filter, MoreHorizontal, Calendar, MapPin, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminPagination } from '../components/AdminPagination';
import { ConfirmButton } from '../../../shared/components/ConfirmButton';
import { useGetAdminEventsQuery, useUpdateEventStatusMutation, useDeleteEventMutation } from '../services/adminApi';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { cn } from '../../../shared/utils/cn';
import { toast } from 'sonner';
import type { Event } from '../../events/services/eventsApi';

const STATUS_CONFIG: Record<string, { dot: string; pill: string }> = {
  draft:     { dot: 'bg-muted-foreground/50',   pill: 'bg-muted/50 text-muted-foreground border-border' },
  published: { dot: 'bg-blue-400',   pill: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  on_sale:   { dot: 'bg-primary',    pill: 'bg-primary/10 text-primary border-primary/20' },
  sold_out:  { dot: 'bg-accent-400', pill: 'bg-accent-500/10 text-accent-400 border-accent-500/20' },
  completed: { dot: 'bg-muted-foreground/40',   pill: 'bg-muted/30 text-muted-foreground border-border' },
  cancelled: { dot: 'bg-red-400',    pill: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const STATUS_KEYS = ['draft', 'published', 'on_sale', 'sold_out', 'completed', 'cancelled'];

function ActionMenu({ event, onPublish, onDelete }: {
  event: Event;
  onPublish: (id: number, status: string) => void;
  onDelete: (id: number) => void;
}) {
  const { t } = useTranslation('admin');
  const [open, setOpen] = useState(false);
  const canPublish = event.status === 'draft' || event.status === 'published';

  return (
    <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground/80 transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-admin-border bg-admin-surface-raised py-1 shadow-2xl shadow-black/50">
          <Link
            to={`/events/${event.slug}`}
            target="_blank"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
          >
            <Eye size={13} /> {t('events.actions.view')}
          </Link>
          <Link
            to={`/admin/events/${event.id}/edit`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
          >
            <Edit size={13} /> {t('events.actions.edit')}
          </Link>
          {canPublish && (
            <button
              onClick={() => { onPublish(event.id, event.status); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-primary hover:bg-primary/10"
            >
              <ChevronDown size={13} />
              {event.status === 'draft' ? t('events.actions.publish') : t('events.actions.openSale')}
            </button>
          )}
          {event.status === 'draft' && (
            <>
              <div className="my-1 border-t border-admin-border" />
              <div className="px-3 py-2">
                <ConfirmButton
                  onConfirm={() => { onDelete(event.id); setOpen(false); }}
                  label={t('events.actions.delete')}
                  confirmLabel={t('events.actions.confirmDelete')}
                  className="flex w-full items-center gap-2.5 text-sm text-red-400 hover:text-red-300"
                >
                  <Trash2 size={13} /> {t('events.actions.delete')}
                </ConfirmButton>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function EventListPage() {
  const { t } = useTranslation('admin');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useGetAdminEventsQuery({
    page,
    limit: 10,
    ...(search && { search }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
  });
  const [updateStatus] = useUpdateEventStatusMutation();
  const [deleteEvent] = useDeleteEventMutation();

  const events = data?.data ?? [];
  const pagination = data?.pagination;

  const handlePublish = async (id: number, currentStatus: string) => {
    const next = currentStatus === 'draft' ? 'published' : 'on_sale';
    try {
      await updateStatus({ id, status: next }).unwrap();
      toast.success(`Đã chuyển sang "${t(`events.status.${next}`)}"`);
      refetch();
    } catch { toast.error(t('events.toast.error')); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEvent(id).unwrap();
      toast.success(t('events.toast.deleteSuccess'));
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message || t('events.toast.deleteError'));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('events.title')}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('events.subtitle', { total: pagination?.total ?? 0, page, totalPages: pagination?.totalPages ?? 1 })}
          </p>
        </div>
        <Link
          to="/admin/events/create"
          className="flex items-center gap-1.5 rounded-xl btn-glass px-4 py-2 text-sm font-semibold hover:opacity-90 transition-colors"
        >
          <Plus size={15} /> {t('events.create')}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('events.searchPlaceholder')}
            className="w-full rounded-xl border border-admin-border bg-foreground/[0.03] py-2 pl-8 pr-3 text-sm text-foreground/80 outline-none placeholder:text-muted-foreground/60 focus:border-border/60 transition-colors"
          />
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-admin-border bg-foreground/[0.03] p-1">
          <Filter size={12} className="ml-2 text-muted-foreground/60" />
          {(['all', ...STATUS_KEYS]).map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-medium transition-all',
                statusFilter === f
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground/80',
              )}
            >
              {f === 'all' ? t('events.filterAll') : t(`events.status.${f}`, { defaultValue: f })}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[70px] rounded-2xl bg-foreground/[0.03] animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-admin-border bg-foreground/[0.02] py-20">
          <Calendar size={40} className="text-muted-foreground/50 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">{t('events.empty.title')}</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            {search || statusFilter !== 'all' ? t('events.empty.filtered') : t('events.empty.noEvents')}
          </p>
          {!search && statusFilter === 'all' && (
            <Link to="/admin/events/create" className="mt-4 text-xs text-primary hover:text-primary-300 transition-colors">
              {t('events.empty.createLink')}
            </Link>
          )}
        </div>
      ) : (
        <div className="admin-chart-card p-0">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{t('events.columns.event')}</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 hidden lg:table-cell">{t('events.columns.time')}</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 hidden md:table-cell">{t('events.columns.venue')}</th>
                <th className="px-5 py-3.5 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{t('events.columns.status')}</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{t('events.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => {
                const cfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.draft;
                return (
                  <tr
                    key={event.id}
                    className={cn(
                      'group border-b border-white/[0.04] transition-all hover:bg-white/[0.025]',
                      i === events.length - 1 && 'border-b-0',
                    )}
                  >
                    {/* Event info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {event.thumbnail_url ? (
                          <img
                            src={event.thumbnail_url}
                            alt=""
                            className="h-10 w-16 rounded-xl object-cover ring-1 ring-white/10 flex-shrink-0 group-hover:ring-white/20 transition-all"
                          />
                        ) : (
                          <div className="flex h-10 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06] group-hover:ring-white/10 transition-all">
                            <Calendar size={14} className="text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground max-w-[200px]">{event.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground/60 capitalize">{event.category}</p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-xs text-muted-foreground">{formatDateTime(event.start_time)}</p>
                    </td>

                    {/* Venue */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-muted-foreground/50 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate max-w-[130px]">
                          {event.venue?.name ?? '—'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                        cfg.pill,
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                        {t(`events.status.${event.status}`, { defaultValue: event.status })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <ActionMenu event={event} onPublish={handlePublish} onDelete={handleDelete} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>{/* overflow-x-auto */}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <AdminPagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={setPage}
          showPageNumbers
        />
      )}
    </div>
  );
}
