import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Calendar, MapPin, X, Download, Ticket as TicketIcon, XCircle } from 'lucide-react';
import { useRequestCancellationMutation } from '../../booking/services/bookingApi';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectAccessToken } from '../../auth/store/authSlice';
import { toast } from 'sonner';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { useGetMyTicketsQuery } from '../services/ticketsApi';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { cn } from '../../../shared/utils/cn';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';
import type { Ticket } from '../services/ticketsApi';

function TicketCard({ ticket, onShowQr, accessToken }: { ticket: Ticket; onShowQr: (t: Ticket) => void; accessToken: string | null }) {
  const { t } = useTranslation('tickets');
  const [requestCancellation, { isLoading: isRequesting }] = useRequestCancellationMutation();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const event = ticket.event;
  const seat = ticket.seat;
  const zone = seat?.zone;

  const handleRequestCancel = async () => {
    try {
      await requestCancellation({ id: (ticket as unknown as { booking_id?: number }).booking_id ?? ticket.id, reason: cancelReason }).unwrap();
      toast.success(t('card.cancelRequestSent'));
      setShowCancelModal(false);
    } catch { toast.error(t('card.cancelRequestError')); }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/pdf`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Tải PDF thất bại');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticket.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error(t('card.downloadError')); }
  };

  const statusLabel = ticket.status === 'active'
    ? t('status.active')
    : ticket.status === 'used'
      ? t('status.used')
      : t('status.cancelled');

  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden transition-all hover:border-primary-600/40', ticket.status === 'used' ? 'border-border opacity-70' : 'border-border')}>
      {event?.thumbnail_url && (
        <div className="aspect-[16/9] overflow-hidden">
          <img src={event.thumbnail_url} alt={event.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm text-foreground line-clamp-1">{event?.title}</p>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', ticket.status === 'active' ? 'bg-primary-600/20 text-primary-400' : ticket.status === 'used' ? 'bg-secondary text-muted-foreground' : 'bg-error/20 text-error')}>
            {statusLabel}
          </span>
        </div>
        {event?.start_time && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar size={11} />{formatDateTime(event.start_time)}</div>}
        {event?.venue && <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={11} />{event.venue.name}, {event.venue.city}</div>}
        {seat && <p className="text-xs text-muted-foreground">{t('card.seat')}: {zone?.name}-{seat.row_label}{seat.seat_number} {Number(zone?.price) > 0 ? `— ${formatCurrency(Number(zone?.price))}` : ''}</p>}
        {ticket.status === 'active' && (
          <div className="mt-2 space-y-1">
            <button onClick={() => onShowQr(ticket)} className="flex w-full items-center justify-center gap-2 rounded-lg btn-glass py-2 text-xs font-semibold">
              <QrCode size={14} /> {t('card.showQr')}
            </button>
            <button onClick={handleDownloadPdf} className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors">
              <Download size={12} /> {t('card.downloadPdf')}
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-error/30 py-2 text-xs font-medium text-error/70 hover:bg-error/5 hover:text-error transition-colors"
            >
              <XCircle size={12} /> {t('card.requestCancel')}
            </button>

            {/* Cancel modal */}
            {showCancelModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCancelModal(false)}>
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5" onClick={e => e.stopPropagation()}>
                  <h3 className="mb-1 font-bold text-foreground">{t('card.requestCancel')}</h3>
                  <p className="mb-4 text-xs text-muted-foreground">{t('card.cancelModalDesc')}</p>
                  <textarea
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder={t('card.cancelReasonPlaceholder')}
                    className="mb-4 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-border/60 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowCancelModal(false)} className="flex-1 rounded-xl border border-border py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors">
                      {t('card.cancelModalClose')}
                    </button>
                    <button onClick={handleRequestCancel} disabled={isRequesting} className="flex-1 rounded-xl bg-error/15 border border-error/40 py-2 text-sm font-semibold text-error hover:bg-error/25 transition-colors disabled:opacity-50">
                      {isRequesting ? '...' : t('card.cancelModalConfirm')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QrModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const { t } = useTranslation('tickets');
  // Đóng modal khi nhấn Escape — chuẩn accessibility
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-foreground">{t('qr.title')}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><X size={16} /></button>
        </div>
        <div className="flex justify-center mb-4 rounded-xl bg-white p-4">
          <QRCode value={ticket.qr_code} size={200} level="H" />
        </div>
        <p className="text-sm font-medium text-foreground">{ticket.event?.title}</p>
        {ticket.seat && <p className="text-xs text-muted-foreground mt-1">{ticket.seat.zone?.name}-{ticket.seat.row_label}{ticket.seat.seat_number}</p>}
        <p className="mt-3 text-xs text-muted-foreground">{t('qr.instruction')}</p>
      </div>
    </div>
  );
}

export function MyTicketsPage() {
  const { t } = useTranslation('tickets');
  usePageMeta({ title: t('title') });
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
  const [showQr, setShowQr] = useState<Ticket | null>(null);
  const accessToken = useSelector(selectAccessToken);
  const { data, isLoading, isError } = useGetMyTicketsQuery({ ...(activeStatus && { status: activeStatus }) });
  const tickets = data?.data ?? [];

  const STATUS_TABS = [
    { value: undefined, label: t('tabs.all') },
    { value: 'active', label: t('tabs.active') },
    { value: 'used', label: t('tabs.used') },
    { value: 'cancelled', label: t('tabs.cancelled') },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{t('title')}</h1>
      <div className="mb-6 flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value ?? 'all'} onClick={() => setActiveStatus(tab.value)} className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-colors', activeStatus === tab.value ? 'btn-glass' : 'border border-border text-muted-foreground hover:border-primary-600/50')}>
            {tab.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-xl skeleton" />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <p className="text-lg font-medium text-foreground">{t('error.loadFailed')}</p>
          <p className="text-sm text-muted-foreground">{t('error.tryAgain')}</p>
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title={t('empty.title')}
          action={<Link to="/events" className="text-primary-400 hover:text-primary-300 transition-colors">{t('empty.explore')}</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} onShowQr={setShowQr} accessToken={accessToken} />)}
        </div>
      )}
      {showQr && <QrModal ticket={showQr} onClose={() => setShowQr(null)} />}
    </div>
  );
}
