import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetEventDetailQuery, useGetEventSeatMapQuery } from '../../events/services/eventsApi';
import { useLockSeatsMutation, useGetMyPendingBookingQuery } from '../services/bookingApi';
import { SeatMap } from '../components/SeatMap';
import { Breadcrumb } from '../../../shared/components/Breadcrumb';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { formatDate } from '../../../shared/utils/formatDate';
import { X, Ticket, AlertCircle, Wifi, ArrowRight } from 'lucide-react';
import { cn } from '../../../shared/utils/cn';
import { toast } from 'sonner';
import { useSocket } from '../../../shared/hooks/useSocket';

interface SelectedSeat {
  seatId: number;
  zoneId: number;
  price: number;
  label?: string;
}

export function SeatSelectionPage() {
  const { t } = useTranslation('booking');
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queueToken = (location.state as { queueToken?: string } | null)?.queueToken;
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [standingSelections, setStandingSelections] = useState<Record<number, number>>({});
  const [standingPrices, setStandingPrices] = useState<Record<number, number>>({});
  const [standingNames, setStandingNames] = useState<Record<number, string>>({});
  const [lockSeats, { isLoading: isLocking }] = useLockSeatsMutation();
  // Trạng thái ghế real-time: override lên dữ liệu từ API
  const [realtimeSeatStatus, setRealtimeSeatStatus] = useState<Record<number, string>>({});
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useSocket();
  // Đánh dấu khi user vừa lock thành công — bỏ qua WebSocket event do chính mình gây ra
  const isNavigatingRef = useRef(false);
  const pendingLockIdsRef = useRef<Set<number>>(new Set());

  const { data: eventData, isLoading: eventLoading } = useGetEventDetailQuery(slug ?? '', { skip: !slug });
  const event = eventData?.data;

  // Guard thêm event.slug === slug để tránh dùng cached event sai khi navigate nhanh giữa events
  const { data: seatMapData, isLoading: mapLoading } = useGetEventSeatMapQuery(event?.id ?? 0, {
    skip: !event?.id || event?.slug !== slug,
  });

  const seatMapZones = seatMapData?.data?.zones ?? [];

  // Kiểm tra pending booking còn hạn cho event này
  const { data: pendingData } = useGetMyPendingBookingQuery(event?.id ?? 0, { skip: !event?.id });
  const existingBookingId = pendingData?.data?.bookingId;

  // Join event room khi có event ID, lắng nghe seat:bulk-updated
  useEffect(() => {
    const eventId = event?.id;
    if (!eventId) return;
    const socket = socketRef.current;
    if (!socket) return;

    const handleConnect = () => { socket.emit('join:event', eventId); setIsConnected(true); };
    const handleDisconnect = () => setIsConnected(false);
    const handleBulkUpdated = (payload: { seats: Array<{ seatId: number; status: string }> }) => {
      if (isNavigatingRef.current) return;

      setRealtimeSeatStatus((prev) => {
        const next = { ...prev };
        for (const s of payload.seats) next[s.seatId] = s.status;
        return next;
      });
      setSelectedSeats((prev) =>
        prev.filter((sel) => {
          const newStatus = payload.seats.find((s) => s.seatId === sel.seatId)?.status;
          if (newStatus && newStatus !== 'available') {
            // Ghế do CHÍNH MÌNH lock (WebSocket đến trước HTTP response) — không warn
            if (pendingLockIdsRef.current.has(sel.seatId)) return true;
            toast.warning(t('seatSelection.seatTaken', { label: sel.label }));
            return false;
          }
          return true;
        }),
      );
    };
    const handleCancelled = () => { toast.error(t('seatSelection.eventCancelled')); navigate('/events'); };

    // socket.on('connect') xử lý reconnect; nếu đã connected thì gọi ngay
    if (socket.connected) handleConnect();
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('seat:bulk-updated', handleBulkUpdated);
    socket.on('event:cancelled', handleCancelled);

    return () => {
      socket.emit('leave:event', eventId);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('seat:bulk-updated', handleBulkUpdated);
      socket.off('event:cancelled', handleCancelled);
    };
  }, [event?.id, socketRef, navigate, t]);

  // Merge seat status từ API với real-time override
  const mergedZones = seatMapZones.map((zone) => ({
    ...zone,
    seats: zone.seats.map((seat) => ({
      ...seat,
      status: (realtimeSeatStatus[seat.id] as typeof seat.status) ?? seat.status,
    })),
  }));

  const totalCurrentTickets = selectedSeats.length + Object.values(standingSelections).reduce((a, b) => a + b, 0);

  const handleUpdateStanding = (zoneId: number, quantity: number, price: number) => {
    setStandingSelections(prev => ({ ...prev, [zoneId]: quantity }));
    if (quantity > 0) {
      setStandingPrices(prev => ({ ...prev, [zoneId]: price }));
      const zoneName = seatMapZones.find(z => z.id === zoneId)?.name || '';
      setStandingNames(prev => ({ ...prev, [zoneId]: zoneName }));
    }
  };

  const handleToggleSeat = (seatId: number, zoneId: number, price: number) => {
    if (seatId === -1) { setSelectedSeats([]); return; } // Escape clears all
    const zone = seatMapZones.find((z) => z.id === zoneId);
    const seat = zone?.seats.find((s) => s.id === seatId);
    const label = seat ? `${zone?.name}-${seat.row_label}${seat.seat_number}` : '';

    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.seatId === seatId);
      if (exists) return prev.filter((s) => s.seatId !== seatId);

      const maxTickets = event?.max_tickets_per_user ?? 5;
      if (totalCurrentTickets >= maxTickets) {
        toast.warning(t('seatSelection.maxTickets', { max: maxTickets }));
        return prev;
      }
      return [...prev, { seatId, zoneId, price, label }];
    });
  };

  const seatsTotal = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);
  const standingTotal = Object.entries(standingSelections).reduce((sum, [zId, qty]) => {
    return sum + (qty * (standingPrices[Number(zId)] || 0));
  }, 0);
  const total = seatsTotal + standingTotal;

  const handleProceed = async () => {
    if (!event || totalCurrentTickets === 0) return;
    // Set TRƯỚC await — WebSocket broadcast có thể đến TRƯỚC HTTP response
    pendingLockIdsRef.current = new Set(selectedSeats.map((s) => s.seatId));
    try {
      const standingPayload = Object.entries(standingSelections)
        .filter(([, qty]) => qty > 0)
        .map(([zId, qty]) => ({ zoneId: Number(zId), quantity: qty }));

      const result = await lockSeats({
        eventId: event.id,
        seatIds: selectedSeats.map((s) => s.seatId),
        standingSelections: standingPayload,
        ...(queueToken && { queueToken }),
      }).unwrap();
      isNavigatingRef.current = true;
      toast.success(t('seatSelection.lockSuccess'));
      navigate(`/checkout/${result.data.bookingId}`, { state: { eventSlug: event.slug } });
    } catch (err: unknown) {
      pendingLockIdsRef.current.clear(); // Lock thất bại → cho phép nhận warning bình thường trở lại
      const msg = (err as { data?: { message?: string } })?.data?.message || t('seatSelection.lockError');
      toast.error(msg);
    }
  };

  if (eventLoading) return <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!event) return <div className="p-8 text-center text-muted-foreground">{t('checkout.notFound')}</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Banner: pending booking còn hạn */}
      {existingBookingId && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-warning">
              <AlertCircle size={16} />
              <span>{t('seatSelection.pendingBanner')}</span>
            </div>
            <button
              onClick={() => navigate(`/checkout/${existingBookingId}`)}
              className="flex items-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 whitespace-nowrap"
            >
              {t('seatSelection.continuePending')} <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <Breadcrumb items={[
              { label: '/', href: '/' },
              { label: 'Events', href: '/events' },
              { label: event.title, href: `/events/${event.slug}` },
              { label: t('seatSelection.breadcrumbSelectSeat') },
            ]} />
            <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(event.start_time)} • {event.venue?.name}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 pb-20 md:px-6 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:pb-0">
        {/* Seat map */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-6">
          {mapLoading ? (
            <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wifi size={12} className={isConnected ? 'text-success' : 'text-error'} />
                {isConnected ? t('seatSelection.syncStatus') : t('seatSelection.connecting')}
              </div>
              
              <SeatMap
                zones={mergedZones}
                selectedSeatIds={selectedSeats.map((s) => s.seatId)}
                onToggleSeat={handleToggleSeat}
                standingSelections={standingSelections}
                onUpdateStanding={handleUpdateStanding}
                maxTicketsPerUser={event.max_tickets_per_user ?? 5}
                totalCurrentTickets={totalCurrentTickets}
              />
            </>
          )}
        </div>

        {/* Sidebar: selected seats + total — chỉ hiện trên desktop, mobile dùng floating CTA */}
        <div className="hidden lg:block mt-4 lg:mt-0">
          <div className="sticky top-[116px] rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Ticket size={16} className="text-primary-700 dark:text-primary-400" />
              {t('seatSelection.selectedSeats', { count: totalCurrentTickets })}
            </h3>

            {totalCurrentTickets === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">{t('seatSelection.noSeats')}</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {selectedSeats.map((s) => (
                  <div key={s.seatId} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-primary-700 dark:text-primary-400 text-xs">{formatCurrency(s.price)}</span>
                      <button onClick={() => handleToggleSeat(s.seatId, s.zoneId, s.price)} className="text-muted-foreground hover:text-error transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Standing selections */}
                {Object.entries(standingSelections).filter(([, qty]) => qty > 0).map(([zId, qty]) => (
                  <div key={`std-${zId}`} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{standingNames[Number(zId)]} <span className="text-xs text-muted-foreground font-normal">x{qty}</span></span>
                    <div className="flex items-center gap-2">
                      <span className="text-primary-700 dark:text-primary-400 text-xs">{formatCurrency((standingPrices[Number(zId)] || 0) * qty)}</span>
                      <button onClick={() => handleUpdateStanding(Number(zId), 0, 0)} className="text-muted-foreground hover:text-error transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted-foreground">{t('seatSelection.total')}</span>
                <span className="font-bold text-foreground text-base">{formatCurrency(total)}</span>
              </div>
              <button
                onClick={handleProceed}
                disabled={totalCurrentTickets === 0 || isLocking}
                className={cn(
                  'w-full rounded-xl py-3 text-sm font-semibold text-white transition-all',
                  'btn-glass',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {isLocking ? t('seatSelection.locking') : t('seatSelection.continue', { count: totalCurrentTickets })}
              </button>
            </div>

            {event.max_tickets_per_user && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <AlertCircle size={11} />
                {t('seatSelection.maxTickets', { max: event.max_tickets_per_user })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Floating CTA bar — chỉ hiện trên mobile khi đã chọn ghế */}
      {totalCurrentTickets > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{t('seatSelection.seatsSelected', { count: totalCurrentTickets })}</p>
              <p className="font-bold text-foreground">{formatCurrency(total)}</p>
            </div>
            <button
              onClick={handleProceed}
              disabled={isLocking}
              className={cn(
                'rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all',
                'btn-glass',
                'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isLocking ? t('seatSelection.locking') : t('seatSelection.continueSimple')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
