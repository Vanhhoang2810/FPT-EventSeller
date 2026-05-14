import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { EventCard } from '../../events/components/EventCard';
import { useGetFavoritesQuery } from '../services/favoritesApi';

export function FavoritesPage() {
  const { t } = useTranslation('events');
  usePageMeta({ title: t('favorite.pageTitle') });
  const { data, isLoading } = useGetFavoritesQuery();
  const events = data?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
        {t('favorite.pageTitle')}
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] rounded-xl skeleton" />)}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t('favorite.empty')}
          description={t('favorite.emptyHint')}
          action={<Link to="/events" className="mt-2 text-sm text-primary-700 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors">{t('favorite.explore')}</Link>}
          iconClassName="bg-error/10 [&>svg]:text-error/60"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {events.map((event) => <EventCard key={event.id} event={{ ...event, isFavorite: true }} />)}
        </div>
      )}
    </div>
  );
}
