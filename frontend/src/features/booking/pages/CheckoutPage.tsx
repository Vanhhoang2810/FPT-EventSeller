import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Logo } from '../../../shared/components/Logo';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  useGetBookingQuery, useCheckoutMutation, useCancelBookingMutation,
  useCreateVnPayUrlMutation, useCreateMoMoPaymentMutation,
} from '../services/bookingApi';
import { selectAccessToken } from '../../auth/store/authSlice';
import { CountdownTimer } from '../components/CountdownTimer';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { Tag, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';
import { cn } from '../../../shared/utils/cn';
import { toast } from 'sonner';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';

export function CheckoutPage() {
  const { t } = useTranslation('booking');
  usePageMeta({ title: t('checkout.title') });
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // Giữ lại slug từ state nếu có (navigate từ SeatSelectionPage), fallback về history
  const eventSlug = (location.state as { eventSlug?: string } | null)?.eventSlug;
  const [method, setMethod] = useState('simulated');
  const checkoutCalledRef = useRef(false);
  // Reset ref khi user đổi method — payment record cũ vẫn tồn tại nhưng backend có idempotency guard
  useEffect(() => { checkoutCalledRef.current = false; }, [method, bookingId]);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const accessToken = useSelector(selectAccessToken);

  const PAYMENT_METHODS = [
    { value: 'simulated', label: t('checkout.methods.simulated'), desc: t('checkout.methods.simulatedDesc') },
    { value: 'vnpay', label: t('checkout.methods.vnpay'), desc: t('checkout.methods.vnpayDesc') },
    { value: 'momo', label: t('checkout.methods.momo'), desc: t('checkout.methods.momoDesc') },
  ];

  const { data, isLoading } = useGetBookingQuery(Number(bookingId), { skip: !bookingId });
  const [checkout, { isLoading: isCheckingOut }] = useCheckoutMutation();
  const [cancelBooking] = useCancelBookingMutation();
  const [createVnPay] = useCreateVnPayUrlMutation();
  const [createMoMo] = useCreateMoMoPaymentMutation();

  const booking = data?.data;

  // useCallback để CountdownTimer tidak restart interval khi CheckoutPage re-render
  const handleExpire = useCallback(async () => {
    setIsExpired(true);
    if (booking) await cancelBooking(booking.id).unwrap().catch(() => {});
    toast.error(t('checkout.expired'), { id: 'booking-expired' });
    navigate(booking?.event?.slug ? `/events/${booking.event.slug}` : '/events');
  }, [booking, cancelBooking, navigate, t]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !booking) return;
    setIsApplyingPromo(true);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code: promoCode.toUpperCase(), amount: Number(booking.total_amount) }),
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        setPromoDiscount(json.data.discountAmount);
        toast.success(t('checkout.promoSuccess', { amount: formatCurrency(json.data.discountAmount) }));
      } else {
        toast.error(json.message || t('checkout.promoInvalid'));
        setPromoDiscount(null);
      }
    } catch {
      toast.error(t('checkout.promoCheckError'));
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleCheckout = async () => {
    if (!booking || isExpired) return;
    try {
      // Bước 1: áp dụng promo + tạo payment record — chỉ gọi 1 lần, tránh double-charge khi retry
      if (!checkoutCalledRef.current) {
        await checkout({
          bookingId: booking.id,
          method,
          ...(promoCode && promoDiscount !== null ? { promoCode: promoCode.toUpperCase() } : {}),
        }).unwrap();
        checkoutCalledRef.current = true;
      }

      // Bước 2: với VNPay/MoMo, lấy URL redirect sau khi discount đã được persist
      if (method === 'vnpay') {
        const res = await createVnPay(booking.id).unwrap();
        if (res.data.url) { window.location.href = res.data.url; return; }
      }

      if (method === 'momo') {
        const res = await createMoMo(booking.id).unwrap();
        const payUrl = res.data?.payUrl;
        if (payUrl) { window.location.href = payUrl; return; }
        toast.error(t('checkout.momoError'));
        return;
      }

      // simulated: checkout đã confirm booking trực tiếp
      toast.success(t('checkout.paySuccess'));
      navigate(`/booking-success/${booking.id}`);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || t('checkout.payError');
      toast.error(msg, { id: 'checkout-error' });
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!booking) return <div className="p-8 text-center text-muted-foreground">{t('checkout.notFound')}</div>;

  const seats = booking.bookingSeats ?? [];
  // Ép kiểu Number() vì Sequelize DECIMAL serialize thành string qua JSON
  const totalAmount = Number(booking.total_amount);
  // Dùng promoDiscount từ validate API nếu có, fallback về booking.discount_amount
  const discountAmount = promoDiscount !== null ? promoDiscount : Number(booking.discount_amount);
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  return (
    <div className="min-h-screen bg-background">
      {/* Header — logo + countdown ở giữa + secure badge */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:block">{t('checkout.seatTimeLeft')}</span>
            <CountdownTimer expiresAt={booking.expires_at} onExpire={handleExpire} />
          </div>
        </div>
      </header>

      {/* Breadcrumb + progress */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          {/* Breadcrumb / back link */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {eventSlug ? (
              <Link
                to={`/events/${eventSlug}`}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={12} /> {t('checkout.backToEvent')}
              </Link>
            ) : (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={12} /> {t('checkout.back')}
              </button>
            )}
          </div>
          {/* Progress steps */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-success font-medium">{t('checkout.stepSelectSeat')}</span>
            <span className="text-muted-foreground/40">›</span>
            <span className="font-semibold text-foreground">{t('checkout.stepPayment')}</span>
            <span className="text-muted-foreground/40">›</span>
            <span>{t('checkout.stepConfirm')}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">

          {/* LEFT — form */}
          <div className="space-y-5">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              {t('checkout.title')}
            </h1>

            {/* Promo code */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Tag size={15} className="text-primary-700 dark:text-primary-400" /> {t('checkout.promoCode')}
              </h3>
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); if (promoDiscount !== null) setPromoDiscount(null); }}
                  placeholder={t('checkout.promoPlaceholder')}
                  className={cn(
                    'flex-1 rounded-xl border bg-secondary px-4 py-2.5 text-sm uppercase tracking-widest',
                    'outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/50',
                    promoDiscount !== null
                      ? 'border-success text-success'
                      : 'border-border text-foreground focus:border-border/60 focus:ring-2 focus:ring-primary-600/20',
                  )}
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={isApplyingPromo || !promoCode.trim()}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors',
                    promoDiscount !== null
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'border border-border hover:bg-secondary disabled:opacity-40',
                  )}
                >
                  {promoDiscount !== null
                    ? <><CheckCircle size={14} /> {t('checkout.promoApplied')}</>
                    : isApplyingPromo
                      ? t('checkout.promoChecking')
                      : t('checkout.applyPromo')}
                </button>
              </div>
              {promoDiscount !== null && (
                <p className="mt-2 text-xs text-success">{t('checkout.promoDiscount', { amount: formatCurrency(promoDiscount) })}</p>
              )}
            </div>

            {/* Payment methods */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t('checkout.paymentMethod')}</h3>
              <div className="space-y-2.5">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all',
                      method === m.value
                        ? 'border-primary-600 bg-primary-600/5 shadow-[0_0_0_1px_rgba(5,150,105,0.3)]'
                        : 'border-border hover:border-border/80 hover:bg-secondary/50',
                    )}
                  >
                    <input
                      type="radio" name="method" value={m.value}
                      checked={method === m.value} onChange={() => setMethod(m.value)}
                      className="accent-primary-600 h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                    {method === m.value && <div className="h-2 w-2 rounded-full bg-primary-500" />}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — order summary */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Event header */}
              {booking.event?.banner_url && (
                <div className="relative h-28 overflow-hidden">
                  <img src={booking.event.banner_url} alt={booking.event.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <p className="absolute bottom-3 left-4 right-4 text-sm font-semibold text-white line-clamp-1">
                    {booking.event.title}
                  </p>
                </div>
              )}

              <div className="p-5">
                {!booking.event?.banner_url && booking.event && (
                  <div className="mb-4 rounded-xl bg-secondary p-3">
                    <p className="text-sm font-semibold text-foreground">{booking.event.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(booking.event.start_time)}</p>
                  </div>
                )}
                {booking.event?.banner_url && (
                  <p className="mb-3 text-xs text-muted-foreground">{formatDateTime(booking.event.start_time)}</p>
                )}

                <h3 className="mb-3 text-sm font-semibold text-foreground">{t('checkout.bookingDetails')}</h3>

                {seats.length > 0 && (
                  <div className="mb-4 space-y-1.5 rounded-xl bg-secondary p-3">
                    {seats.map((bs) => (
                      <div key={bs.id} className="flex justify-between text-xs">
                        <span className="text-muted-foreground font-mono">
                          {bs.seat?.zone?.name}-{bs.seat?.row_label}{bs.seat?.seat_number}
                        </span>
                        <span className="font-medium text-foreground">{formatCurrency(Number(bs.price))}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('checkout.subtotalWithCount', { count: seats.length })}</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between font-medium text-success">
                      <span>{t('checkout.discount')}</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                    <span className="text-foreground">{t('checkout.total')}</span>
                    <span className="text-primary-700 dark:text-primary-400">{formatCurrency(finalAmount)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || isExpired}
                  className={cn(
                    'mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-white',
                    'bg-accent-500/15 backdrop-blur-md border border-accent-500/40 text-accent-600 dark:text-accent-400',
                    'transition-all hover:opacity-90 hover:shadow-[0_0_24px_rgba(249,115,22,0.5)]',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  {isCheckingOut ? t('checkout.processing') : t('checkout.pay')}
                  {!isCheckingOut && <ChevronRight size={18} />}
                </button>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {t('checkout.securePayment')}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
