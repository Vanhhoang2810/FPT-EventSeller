import { Link } from 'react-router-dom';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useGetTrendingEventsQuery } from '../../events/services/eventsApi';
import { EventCard } from '../../events/components/EventCard';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
} as const;

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
} as const;

export function TrendingEvents() {
  const { t } = useTranslation('events');
  const { data, isLoading } = useGetTrendingEventsQuery();
  const events = data?.data ?? [];

  return (
    <section className="ambient-green relative mx-auto max-w-7xl px-4 py-20 md:px-6">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mb-10 flex items-end justify-between"
      >
        <div>
          {/* Eyebrow label */}
          <div className="section-eyebrow mb-3">
            <TrendingUp size={11} />
            {t('landing.trending')}
          </div>
          <h2
            className="text-3xl font-black tracking-tight md:text-4xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {t('landing.trending')}
          </h2>
        </div>
        <Link
          to="/events?sort=trending"
          className="group hidden items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-all hover:border-primary-500/50 hover:text-primary-700 dark:text-primary-400 sm:flex"
        >
          {t('landing.seeAll')}
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl skeleton" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">{t('landing.noTrending')}</p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {events.slice(0, 8).map((event) => (
            <motion.div key={event.id} variants={item}>
              <EventCard event={event} className="card-gradient-border shimmer-hover" />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Mobile see all */}
      <div className="mt-8 flex justify-center sm:hidden">
        <Link
          to="/events?sort=trending"
          className="flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-primary-700 dark:text-primary-400"
        >
          {t('landing.seeAll')} <ChevronRight size={14} />
        </Link>
      </div>
    </section>
  );
}
