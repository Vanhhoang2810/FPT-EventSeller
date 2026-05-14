import { Link } from 'react-router-dom';
import { Bell, BellRing, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGetFeaturedEventsQuery, useRemindEventMutation } from '../../events/services/eventsApi';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../../../shared/utils/cn';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../auth/store/authSlice';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

function Countdown({ target }: { target: string }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const idRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        if (idRef.current) { clearInterval(idRef.current); idRef.current = null; }
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    idRef.current = setInterval(calc, 1000);
    return () => { if (idRef.current) clearInterval(idRef.current); };
  }, [target]);

  return (
    <div className="flex items-center gap-1 font-mono text-xs text-warning">
      <Clock size={11} />
      <span>
        {timeLeft.d > 0 ? `${timeLeft.d}n ` : ''}
        {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
      </span>
    </div>
  );
}

export function UpcomingSales() {
  const { data, isLoading } = useGetFeaturedEventsQuery();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [remindEvent] = useRemindEventMutation();
  const { t } = useTranslation('events');
  const [reminded, setReminded] = useState<Set<number>>(new Set());
  const events = data?.data?.upcoming ?? [];

  if (isLoading || events.length === 0) return null;

  return (
    <section className="ambient-orange relative mx-auto max-w-7xl px-4 py-20 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mb-10 flex items-end justify-between"
      >
        <div>
          <div className="section-eyebrow mb-3" style={{ color: '#F97316', borderColor: 'rgba(249,115,22,0.25)', background: 'rgba(249,115,22,0.08)' }}>
            <Clock size={11} />
            {t('landing.upcomingSales')}
          </div>
          <h2
            className="text-3xl font-black tracking-tight md:text-4xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {t('landing.upcomingSales')}
          </h2>
        </div>
        <Link to="/events?status=published" className="group hidden items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-all hover:border-accent-500/50 hover:text-accent-400 sm:flex">
          {t('landing.seeAll')} <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
          <Link
            to={`/events/${event.slug}`}
            className={cn(
              'relative min-w-[280px] rounded-2xl border border-border bg-card p-4 overflow-hidden',
              'flex flex-col gap-3 transition-all hover:border-accent-500/40 hover:shadow-lg hover:shadow-accent-500/5 hover:scale-[1.01]',
              'card-gradient-border',
            )}
            style={{ '--tw-gradient-from': '#F97316', '--tw-gradient-to': '#10B981' } as React.CSSProperties}
          >
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-secondary">
              {(event.thumbnail_url || event.banner_url) && (
                <img
                  src={event.thumbnail_url || event.banner_url}
                  alt={event.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
            <div>
              <p className="mb-1 line-clamp-1 text-sm font-semibold text-foreground">{event.title}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(event.start_time)}</p>
              {event.minPrice && (
                <p className="text-xs font-medium text-primary-700 dark:text-primary-400 mt-1">{t('landing.hero.fromPrice')} {formatCurrency(event.minPrice)}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              {new Date(event.sale_start_time) <= new Date()
                ? <span className="text-xs text-success font-medium">{t('status.on_sale')}</span>
                : <Countdown target={event.sale_start_time} />
              }
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  if (!isAuthenticated) { toast.info(t('landing.upcoming.remindLoginRequired')); return; }
                  if (reminded.has(event.id)) return;
                  try {
                    await remindEvent(event.id).unwrap();
                    setReminded((prev) => new Set(prev).add(event.id));
                    toast.success(t('landing.upcoming.remindSuccess'));
                  } catch (err: unknown) {
                    const msg = (err as { data?: { message?: string } })?.data?.message;
                    if (msg?.includes('đã đăng ký')) { setReminded((prev) => new Set(prev).add(event.id)); return; }
                    toast.error(msg || t('landing.upcoming.remindError'));
                  }
                }}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors',
                  reminded.has(event.id)
                    ? 'border-primary-600/50 text-primary-700 dark:text-primary-400 bg-primary-600/10'
                    : 'border-border text-muted-foreground hover:border-primary-600/50 hover:text-primary-600 dark:hover:text-primary-400',
                )}
              >
                {reminded.has(event.id) ? <BellRing size={10} /> : <Bell size={10} />}
                {reminded.has(event.id) ? t('landing.upcoming.reminded') : t('landing.remindMe')}
              </button>
            </div>
          </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
