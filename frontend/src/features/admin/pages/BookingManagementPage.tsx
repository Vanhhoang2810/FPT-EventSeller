import { useState } from 'react';
import { toast } from 'sonner';
import { Search, BookOpen, RotateCcw, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminPagination } from '../components/AdminPagination';
import { ConfirmButton } from '../../../shared/components/ConfirmButton';
import { useGetAdminBookingsFilteredQuery, useRefundBookingMutation } from '../services/adminApi';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { cn } from '../../../shared/utils/cn';

const STATUS_CONFIG: Record<string, { pill: string; dot: string }> = {
  pending:   { dot: 'bg-amber-400',  pill: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  confirmed: { dot: 'bg-primary',    pill: 'bg-primary/10 text-primary border-primary/20' },
  cancelled: { dot: 'bg-red-400',    pill: 'bg-red-500/10 text-red-400 border-red-500/20' },
  expired:   { dot: 'bg-muted-foreground/50', pill: 'bg-muted/30 text-muted-foreground border-border' },
};

interface Booking {
  id: number; status: string; total_amount: number; seat_count: number; created_at: string;
  cancellation_requested?: boolean;
  cancellation_reason?: string | null;
  user?: { email: string; full_name: string };
  event?: { title: string };
  payment?: { method: string };
}

export function BookingManagementPage() {
  const { t } = useTranslation('admin');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useGetAdminBookingsFilteredQuery({ limit: 10,
    page,
    ...(status && { status }),
    ...(search && { search }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });
  const [refundBooking] = useRefundBookingMutation();

  const bookings = (data?.data ?? []) as Booking[];
  const pagination = data?.pagination;

  const handleRefund = async (id: number) => {
    try {
      await refundBooking(id).unwrap();
      toast.success(t('bookings.refund.success'));
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message || t('bookings.refund.error'));
    }
  };

  const clearFilters = () => { setSearch(''); setStartDate(''); setEndDate(''); setStatus(''); setPage(1); };
  const hasFilter = search || startDate || endDate || status;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('bookings.title')}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('bookings.subtitle', { total: pagination?.total ?? 0 })}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('bookings.searchPlaceholder')}
            className="w-full rounded-xl border border-admin-border bg-foreground/[0.03] py-2 pl-8 pr-3 text-sm text-foreground/80 outline-none placeholder:text-muted-foreground/60 focus:border-border/60 transition-colors"
          />
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 rounded-xl border border-admin-border bg-foreground/[0.03] p-1">
          {['', 'pending', 'confirmed', 'cancelled', 'expired'].map((s) => {
            const cfg = s ? STATUS_CONFIG[s] : null;
            return (
              <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                className={cn('rounded-lg px-3 py-1 text-xs font-medium transition-all flex items-center gap-1.5',
                  status === s ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground/80',
                )}>
                {cfg && <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />}
                {s === '' ? t('bookings.filterAll') : t(`bookings.status.${s}`, { defaultValue: s })}
              </button>
            );
          })}
          {/* Filter yêu cầu hủy */}
          <button
            onClick={() => { setStatus('cancel_requested'); setPage(1); }}
            className={cn('rounded-lg px-3 py-1 text-xs font-medium transition-all flex items-center gap-1.5',
              status === 'cancel_requested' ? 'bg-error/15 text-error' : 'text-muted-foreground hover:text-foreground/80',
            )}>
            <AlertTriangle size={11} />
            Yêu cầu hủy
          </button>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-admin-border bg-foreground/[0.03] px-3 py-2 text-sm text-muted-foreground outline-none focus:border-border/60 transition-colors" />
          <span className="text-muted-foreground/60 text-xs">—</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-admin-border bg-foreground/[0.03] px-3 py-2 text-sm text-muted-foreground outline-none focus:border-border/60 transition-colors" />
        </div>

        {hasFilter && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 rounded-xl border border-admin-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground/80 transition-colors">
            <RotateCcw size={11} /> {t('bookings.clearFilters')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-foreground/[0.03] animate-pulse" />)}
        </div>
      ) : (
        <div className="admin-chart-card p-0">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-foreground/[0.05]">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{t('bookings.columns.orderId')}</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{t('bookings.columns.customer')}</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 hidden lg:table-cell">{t('bookings.columns.event')}</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 hidden md:table-cell">{t('bookings.columns.amount')}</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{t('bookings.columns.status')}</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 hidden md:table-cell">{t('bookings.columns.bookedAt')}</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{t('bookings.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => {
                const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.expired;
                return (
                  <tr key={b.id} className={cn('border-b border-foreground/[0.04] hover:bg-foreground/[0.025] transition-colors', i === bookings.length - 1 && 'border-b-0')}>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-muted-foreground">#{String(b.id).padStart(6, '0')}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-foreground">{b.user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{b.user?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <p className="text-xs text-muted-foreground max-w-[180px] truncate">{b.event?.title}</p>
                      {b.payment?.method && (
                        <span className="text-[10px] text-muted-foreground/60">{t(`bookings.method.${b.payment.method}`, { defaultValue: b.payment.method })}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right hidden md:table-cell">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(b.total_amount))}</p>
                      <p className="text-[10px] text-muted-foreground/60">{t('bookings.seatCount', { count: b.seat_count })}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium', cfg.pill)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                          {t(`bookings.status.${b.status}`, { defaultValue: b.status })}
                        </span>
                        {/* Badge yêu cầu hủy */}
                        {b.cancellation_requested && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-error/10 border border-error/30 px-2 py-0.5 text-[10px] font-medium text-error" title={b.cancellation_reason ?? ''}>
                            <AlertTriangle size={9} /> Yêu cầu hủy
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-muted-foreground">{formatDateTime(b.created_at)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {b.status === 'confirmed' && (
                        <ConfirmButton
                          onConfirm={() => handleRefund(b.id)}
                          label={t('bookings.refund.label')}
                          confirmLabel={t('bookings.refund.confirm')}
                          className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors ml-auto"
                        >
                          <RotateCcw size={11} /> {t('bookings.refund.button')}
                        </ConfirmButton>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>{/* overflow-x-auto */}
          {bookings.length === 0 && (
            <div className="flex flex-col items-center py-16">
              <BookOpen size={36} className="text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">{t('bookings.empty')}</p>
              {hasFilter && <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:text-primary-300">{t('bookings.clearFilters')}</button>}
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
