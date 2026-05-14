import DOMPurify from 'dompurify';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Heart, Share2, ChevronRight, Music } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGetEventDetailQuery, useToggleFavoriteMutation } from '../services/eventsApi';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../auth/store/authSlice';
import { Breadcrumb } from '../../../shared/components/Breadcrumb';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { cn } from '../../../shared/utils/cn';
import { toast } from 'sonner';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';

export function EventDetailPage() {
  const { t } = useTranslation('events');
  const { slug } = useParams<{ slug: string }>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [toggleFavorite, { isLoading: isTogglingFav }] = useToggleFavoriteMutation();
  const { data, isLoading, error } = useGetEventDetailQuery(slug ?? '');
  const event = data?.data;

  usePageMeta({
    title: event?.title ?? t('title'),
    description: event?.short_description ?? `Đặt vé ${event?.title ?? 'sự kiện'} tại Ticket Rush`,
    ogTitle: event?.title,
    ogDescription: event?.short_description,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="h-[50vh] skeleton" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <div className="h-8 w-2/3 skeleton rounded" />
              <div className="h-4 w-full skeleton rounded" />
              <div className="h-4 w-5/6 skeleton rounded" />
            </div>
            <div className="h-64 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <Music size={32} className="text-muted-foreground/40" />
        </div>
        <p className="text-lg font-medium">{t('detail.notFound')}</p>
        <Link to="/events" className="text-primary-700 dark:text-primary-400 hover:text-primary-300">{t('detail.backToList')}</Link>
      </div>
    );
  }

  // Guard: reduce trên mảng rỗng trả về Infinity — cần check length trước
  const minPrice = (event.zones && event.zones.length > 0)
    ? event.zones.reduce((min, z) => Math.min(min, Number(z.price)), Infinity)
    : null;
  const canBuy = event.status === 'on_sale';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner — w-full h-fixed để tránh aspect-ratio giới hạn width trên màn hình rộng */}
      <div className="relative h-[400px] w-full overflow-hidden bg-secondary md:h-[500px]">
        {event.banner_url ? (
          <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-900/40 to-secondary">
            <Music size={64} className="text-primary-400/30" />
          </div>
        )}
        {/* Overlay tối cố định — không dùng var(--background) để đảm bảo text-white readable trên cả light/dark */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-7xl">
            <Breadcrumb
              className="mb-3 text-white/70"
              items={[
                { label: t('landing.seeAll'), href: '/' },
                { label: t('categories.' + event.category, { defaultValue: t('title') }), href: `/events?category=${event.category}` },
                { label: event.title },
              ]}
            />
            <h1 className="text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
              {event.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
              <div className="flex items-center gap-1"><Calendar size={14} /><span>{formatDateTime(event.start_time)}</span></div>
              {event.venue && <div className="flex items-center gap-1"><MapPin size={14} /><span>{event.venue.name}</span></div>}
              {minPrice !== null && minPrice > 0 && <span className="font-semibold text-primary-300">{t('detail.startingFrom', { price: formatCurrency(minPrice) })}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px]">
          {/* Left: description */}
          <div>
            {event.short_description && (
              <p className="mb-4 text-base text-muted-foreground leading-relaxed">{event.short_description}</p>
            )}

            {event.description && (
              <div
                className="prose dark:prose-invert max-w-none text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description) }}
              />
            )}

            {/* Venue info */}
            {event.venue && (
              <div className="mt-8 rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 font-semibold text-foreground">{t('detail.venue')}</h3>
                <p className="text-sm font-medium text-foreground">{event.venue.name}</p>
                <p className="text-sm text-muted-foreground">{(event.venue as unknown as { address?: string }).address || ''}</p>
                {event.venue.city && <p className="text-sm text-muted-foreground">{event.venue.city}</p>}
              </div>
            )}
          </div>

          {/* Right: pricing card (sticky) */}
          <div className="md:sticky md:top-24 md:self-start">
            <div className="rounded-xl border border-border bg-card p-5">
              {/* Status badge */}
              <div className="mb-4 flex items-center justify-between">
                <span className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  event.status === 'on_sale' ? 'bg-primary-600/20 text-primary-700 dark:text-primary-400' :
                  event.status === 'sold_out' ? 'bg-error/20 text-error' :
                  'bg-secondary text-muted-foreground',
                )}>
                  {t('status.' + event.status, { defaultValue: event.status })}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={isTogglingFav}
                    onClick={async () => {
                      if (!isAuthenticated) { toast.info(t('detail.favoriteLoginRequired')); return; }
                      try {
                        const res = await toggleFavorite(event.id).unwrap();
                        if (res.data.isFavorite) {
                          toast.success(t('detail.favoriteAdded'), { id: 'favorite-toggle' });
                        } else {
                          toast.error(t('detail.favoriteRemoved'), { id: 'favorite-toggle' });
                        }
                      } catch {
                        toast.error(t('detail.favoriteLoginRequired'), { id: 'favorite-toggle' });
                      }
                    }}
                    className={cn('rounded-lg border border-border p-2 transition-colors hover:text-foreground disabled:opacity-50', event.isFavorite ? 'text-error border-error/30' : 'text-muted-foreground')}
                    aria-label={event.isFavorite ? t('favorite.remove') : t('favorite.add')}
                  >
                    <Heart size={16} fill={event.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                        .then(() => toast.success(t('detail.shareSuccess')))
                        .catch(() => toast.info(`Link: ${window.location.href}`));
                    }}
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={t('detail.shareAriaLabel')}
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              {/* Zones pricing */}
              {event.zones && event.zones.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-sm font-medium text-foreground mb-2">{t('detail.pricing')}</p>
                  {[...event.zones].sort((a, b) => a.sort_order - b.sort_order).map((zone) => {
                    const available = zone.seats?.filter((s) => s.status === 'available').length ?? 0;
                    const total = zone.seats?.length ?? 0;
                    return (
                      <div key={zone.id} className="flex items-center justify-between rounded-lg bg-secondary p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: zone.color_code }} />
                          <span className="font-medium text-foreground">{zone.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary-700 dark:text-primary-400">{formatCurrency(zone.price)}</p>
                          <p className="text-xs text-muted-foreground">{t('detail.remaining', { count: available, total })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CTA */}
              {canBuy ? (
                <Link
                  to={`/events/${event.slug}/seats`}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold',
                    'btn-glass',
                    'transition-all',
                  )}
                >
                  {t('detail.selectSeat')} <ChevronRight size={16} />
                </Link>
              ) : (
                <button disabled className="w-full rounded-xl border border-border py-3.5 text-sm font-medium text-muted-foreground cursor-not-allowed">
                  {event.status === 'sold_out' ? t('status.sold_out') :
                   event.status === 'published' ? t('detail.saleOpens', { date: formatDateTime(event.sale_start_time) }) :
                   t('status.' + event.status, { defaultValue: event.status })}
                </button>
              )}

              {/* Meta info */}
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Clock size={11} /><span>{t('detail.startTime', { time: formatDateTime(event.start_time) })}</span></div>
                <div className="flex items-center gap-1.5"><Users size={11} /><span>{t('detail.maxPerPerson', { max: event.max_tickets_per_user })}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
