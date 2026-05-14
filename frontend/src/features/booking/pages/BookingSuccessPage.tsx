import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Eye, Home, Ticket, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGetBookingQuery } from '../services/bookingApi';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { formatDateTime } from '../../../shared/utils/formatDate';

export function BookingSuccessPage() {
  const { t } = useTranslation('booking');
  const { bookingId } = useParams<{ bookingId: string }>();
  const { data, isLoading, isError } = useGetBookingQuery(Number(bookingId), { skip: !bookingId });
  const booking = data?.data;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* Animated success icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="mb-6 flex justify-center"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/10 ring-4 ring-success/20">
            <CheckCircle size={52} className="text-success" strokeWidth={1.5} />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.25 }}
        >
          <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('success.title')}
          </h1>
          <p className="mb-8 text-muted-foreground">
            {t('success.subtitle')}
          </p>
        </motion.div>

        {/* Booking summary */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          className="mb-8"
        >
          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-5 rounded skeleton" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-3 text-sm text-muted-foreground">
              <AlertCircle size={16} className="text-warning flex-shrink-0" />
              {t('success.loadError')}
            </div>
          ) : booking ? (
            <div className="rounded-xl border border-border bg-card p-5 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('success.orderId')}</span>
                <span className="font-mono font-bold text-foreground">
                  #{String(booking.id).padStart(6, '0')}
                </span>
              </div>
              {booking.event && (
                <>
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-muted-foreground flex-shrink-0">{t('success.event')}</span>
                    <span className="font-medium text-foreground text-right">{booking.event.title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('success.date')}</span>
                    <span className="text-foreground">{formatDateTime(booking.event.start_time)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm border-t border-border pt-3">
                <span className="text-muted-foreground">{t('success.seats')}</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Ticket size={12} /> {t('success.seatCount', { count: booking.seat_count })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('success.totalPaid')}</span>
                <span className="font-bold text-primary-700 dark:text-primary-400">{formatCurrency(Math.max(0, Number(booking.total_amount) - Number(booking.discount_amount ?? 0)))}</span>
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.45 }}
          className="flex flex-col gap-3"
        >
          <Link
            to="/my-tickets"
            className="flex items-center justify-center gap-2 rounded-xl btn-glass py-3 text-sm font-semibold transition-colors hover:opacity-90"
          >
            <Eye size={15} /> {t('success.viewTickets')}
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            <Home size={15} /> {t('success.backHome')}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
