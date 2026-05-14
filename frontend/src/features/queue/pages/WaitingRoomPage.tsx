import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetEventDetailQuery } from '../../events/services/eventsApi';
import { useJoinQueueMutation, useGetQueuePositionQuery } from '../services/queueApi';
import { useSocket } from '../../../shared/hooks/useSocket';
import { Users, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function WaitingRoomPage() {
  const { t } = useTranslation('queue');
  const { slug, eventId } = useParams<{ slug: string; eventId: string }>();
  const navigate = useNavigate();
  const parsedEventId = Number(eventId);

  const { data: eventData } = useGetEventDetailQuery(slug ?? '', { skip: !slug });
  const event = eventData?.data;

  const [joinQueue, { isLoading: isJoining }] = useJoinQueueMutation();
  const { data: positionData, refetch: refetchPosition } = useGetQueuePositionQuery(parsedEventId, {
    skip: !parsedEventId,
    pollingInterval: 30000,
  });

  // Đánh dấu refetchPosition đã dùng để tránh unused variable warning
  void refetchPosition;

  const [queueToken, setQueueToken] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<number>(0);
  const [isGranted, setIsGranted] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const socketRef = useSocket();

  // Đồng bộ position từ polling
  useEffect(() => {
    if (!positionData?.data) return;
    const { position: p, estimatedWait: w, isActive, token } = positionData.data as { position: number; estimatedWait: number; isActive: boolean; token?: string };
    if (isActive || p === 0) {
      if (token) setQueueToken(token); // seed token từ polling khi WebSocket bị miss
      setIsGranted(true);
    } else if (p > 0) {
      setPosition(p);
      setEstimatedWait(w);
    }
  }, [positionData]);

  // Lắng nghe WebSocket events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !parsedEventId) return;

    const handlePosition = (data: { position: number; estimatedWait: number }) => {
      setPosition(data.position);
      setEstimatedWait(data.estimatedWait);
    };
    const handleGranted = (data: { token: string; expiresAt: string }) => {
      setQueueToken(data.token);
      setIsGranted(true);
    };

    socket.on('queue:position', handlePosition);
    socket.on('queue:granted', handleGranted);

    return () => {
      socket.off('queue:position', handlePosition);
      socket.off('queue:granted', handleGranted);
    };
  }, [parsedEventId, socketRef]);

  // Auto join khi vào trang
  useEffect(() => {
    if (!parsedEventId || hasJoined) return;
    setHasJoined(true);
    joinQueue(parsedEventId)
      .unwrap()
      .then((res) => {
        const { position: p, estimatedWait: w, isActive, token } = res.data as { position: number; estimatedWait: number; isActive: boolean; token?: string };
        if (isActive) { if (token) setQueueToken(token); setIsGranted(true); }
        else { setPosition(p); setEstimatedWait(w); }
      })
      .catch((err) => {
        const msg = (err as { data?: { message?: string } })?.data?.message || t('joinError');
        toast.error(msg);
        navigate(`/events/${slug}`);
      });
  }, [parsedEventId, hasJoined, joinQueue, navigate, slug, t]);

  const handleEnter = () => {
    if (!slug) return;
    // Dùng navigation state thay vì URL để token không lộ trong history/logs
    navigate(`/events/${slug}/seats`, { state: { queueToken } });
  };

  if (isGranted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
          <CheckCircle size={40} className="text-success" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('yourTurn')}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {t('yourTurnDesc')}
        </p>
        {event && (
          <p className="mb-6 text-sm text-muted-foreground">
            {t('eventLabel', { title: event.title })}
          </p>
        )}
        <button
          onClick={handleEnter}
          className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 text-base font-bold text-white shadow-lg hover:opacity-90 transition-all"
        >
          {t('enterNow')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600/5 animate-pulse" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary-600/30 bg-primary-600/10">
            <Users size={36} className="text-primary-700 dark:text-primary-400" />
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('titleVirtual')}
        </h1>
        {event && (
          <p className="mb-6 text-sm text-muted-foreground">{event.title}</p>
        )}

        {isJoining || position === null ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
            <Loader2 size={20} className="animate-spin" />
            {t('joining')}
          </div>
        ) : (
          <>
            {/* Position display */}
            <div className="mb-8 rounded-2xl border border-border bg-card p-8">
              <p className="text-sm text-muted-foreground">{t('position')}</p>
              <p className="my-2 text-6xl font-bold text-primary-700 dark:text-primary-400" style={{ fontFamily: 'var(--font-heading)' }}>
                #{position}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Clock size={14} />
                {t('estimatedMinutes', { min: estimatedWait })}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {t('keepPage')}
            </p>
            <p className="mt-2 text-xs text-muted-foreground/60">
              {t('refreshSafe')}
            </p>

            {/* Progress dots */}
            <div className="mt-8 flex items-center justify-center gap-1.5">
              {Array.from({ length: Math.min(position, 8) }).map((_, i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: i === 0 ? '#059669' : `rgba(5, 150, 105, ${1 - i * 0.12})`,
                  }}
                />
              ))}
              {position > 8 && <span className="text-xs text-muted-foreground">+{position - 8}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
