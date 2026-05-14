import { Link } from 'react-router-dom';
import { Calendar, MapPin, Music, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../shared/utils/formatDate';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { cn } from '../../../shared/utils/cn';
import type { Event } from '../services/eventsApi';
import { useToggleFavoriteMutation } from '../services/eventsApi';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../auth/store/authSlice';
import { toast } from 'sonner';

interface EventCardProps {
  event: Event;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const { t } = useTranslation('events');
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [toggleFavorite, { isLoading: isToggling }] = useToggleFavoriteMutation();

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error(t('favorite.loginRequired')); return; }
    try {
      const res = await toggleFavorite(event.id).unwrap();
      if (res.data.isFavorite) {
        toast.success(t('detail.favoriteAdded'), { id: 'favorite-toggle' });
      } else {
        toast.error(t('detail.favoriteRemoved'), { id: 'favorite-toggle' });
      }
    } catch { toast.error(t('detail.favoriteLoginRequired')); }
  };

  const statusBadge = () => {
    switch (event.status) {
      case 'on_sale':   return <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm" style={{ background: 'rgba(5,150,105,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(16,185,129,0.45)' }}>{t('status.on_sale')}</span>;
      case 'sold_out':  return <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/80">{t('status.sold_out')}</span>;
      case 'published': return <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/70">{t('status.coming_soon')}</span>;
      default: return null;
    }
  };

  return (
    <Link
      to={`/events/${event.slug}`}
      className={cn(
        'group relative block overflow-hidden rounded-2xl',
        'transition-transform duration-300 hover:scale-[1.02]',
        // Subtle card shadow lifted on hover
        'shadow-md hover:shadow-xl hover:shadow-black/20',
        className,
      )}
    >
      {/* Portrait image — 3:4 ratio như DICE/Eventbrite */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        {event.thumbnail_url || event.banner_url ? (
          <img
            src={event.thumbnail_url || event.banner_url}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-900/60 to-secondary">
            <Music size={48} className="text-primary-400/40" />
          </div>
        )}

        {/* Gradient overlay — text readable on any image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Top row: status + favorite */}
        <div className="absolute left-3 top-3 right-3 flex items-center justify-between">
          {statusBadge() ?? <span />}
          <button
            onClick={handleFavorite}
            disabled={isToggling}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm transition-all',
              'bg-black/30 hover:bg-black/50',
              event.isFavorite ? 'text-error' : 'text-white/70 hover:text-white',
            )}
            aria-label={event.isFavorite ? t('favorite.remove') : t('favorite.add')}
          >
            <Heart size={13} fill={event.isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Bottom info — directly on image */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 space-y-1">
          {/* Category pill */}
          <span className="inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60 backdrop-blur-sm">
            {t('categories.' + event.category, { defaultValue: event.category })}
          </span>

          {/* Title */}
          <h3
            className="text-sm font-bold text-white leading-snug line-clamp-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {event.title}
          </h3>

          {/* Date + venue */}
          <div className="space-y-0.5">
            {event.start_time && (
              <div className="flex items-center gap-1 text-[11px] text-white/60">
                <Calendar size={10} className="flex-shrink-0" />
                <span>{formatDate(event.start_time)}</span>
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-1 text-[11px] text-white/50">
                <MapPin size={10} className="flex-shrink-0" />
                <span className="truncate">{event.venue.name}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="pt-0.5">
            {event.minPrice != null && event.minPrice > 0 ? (
              <span className="text-xs font-bold text-primary-700 dark:text-primary-300">
                {t('detail.startingFrom', { price: formatCurrency(event.minPrice) })}
              </span>
            ) : event.minPrice === 0 ? (
              <span className="text-xs font-bold text-success">{t('card.free')}</span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
