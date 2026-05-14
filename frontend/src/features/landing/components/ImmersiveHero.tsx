import { Link } from 'react-router-dom';
import { Search, Music, Trophy, Mic, Sparkles, CalendarDays, CalendarRange, MapPin, ArrowRight, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../shared/utils/cn';
import type { Event } from '../../events/services/eventsApi';
import { formatDate } from '../../../shared/utils/formatDate';
import { formatCurrency } from '../../../shared/utils/formatCurrency';

interface ImmersiveHeroProps {
  featuredEvent?: Event;
}

const QUICK_FILTERS: Array<{ labelKey: string; param: string; icon: LucideIcon }> = [
  { labelKey: 'landing.today',       param: 'today',    icon: CalendarDays },
  { labelKey: 'landing.thisWeek',    param: 'week',     icon: CalendarRange },
  { labelKey: 'categories.music',    param: 'music',    icon: Music },
  { labelKey: 'categories.sports',   param: 'sports',   icon: Trophy },
  { labelKey: 'categories.theater',  param: 'theater',  icon: Mic },
  { labelKey: 'categories.festival', param: 'festival', icon: Sparkles },
];

export function ImmersiveHero({ featuredEvent }: ImmersiveHeroProps) {
  const { t } = useTranslation('events');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/events?search=${encodeURIComponent(searchQuery)}`);
    else navigate('/events');
  };

  const handleQuickFilter = (param: string) => {
    const cats = ['music', 'sports', 'theater', 'festival', 'comedy', 'conference'];
    if (cats.includes(param)) navigate(`/events?category=${param}`);
    else if (param === 'today') {
      const d = new Date().toISOString().split('T')[0];
      navigate(`/events?startDate=${d}&endDate=${d}`);
    } else if (param === 'week') {
      const now = new Date();
      const end = new Date(now.getTime() + 7 * 86400000);
      navigate(`/events?startDate=${now.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`);
    }
  };

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Mesh gradient — tự adapt theo light/dark mode */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Decorative blobs */}
      <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/8 blur-[120px]" />
      <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-accent-500/6 blur-[100px]" />

      {/* Content — centered */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-24 pt-28">
        <div className="mx-auto w-full max-w-4xl">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex justify-center"
          >
            <span className="section-eyebrow">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500" />
              {t('landing.hero.eyebrow')}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-4 text-center"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontSize: 'clamp(2.8rem, 7vw, 5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
            }}
          >
            <span className="gradient-text">{t('landing.hero.heading1')}</span>
            <br />
            <span className="text-foreground">{t('landing.hero.heading2')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mx-auto mb-10 max-w-xl text-center text-base text-muted-foreground md:text-lg"
            style={{ textWrap: 'balance' } as React.CSSProperties}
          >
            {t('landing.hero.subheading')}
          </motion.p>

          {/* Search bar — glassmorphism */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onSubmit={handleSearch}
            className="mx-auto mb-6 max-w-2xl"
          >
            <div className={cn(
              'flex items-center overflow-hidden rounded-2xl',
              'border border-white/50 dark:border-white/10',
              'bg-white/40 dark:bg-white/5',
              'shadow-xl shadow-black/8 dark:shadow-black/30',
              'backdrop-blur-xl',
              'transition-all focus-within:border-primary-500/60 focus-within:shadow-[0_0_0_3px_rgba(5,150,105,0.15)]',
            )}>
              <Search size={18} className="ml-5 flex-shrink-0 text-foreground/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('landing.hero.searchPlaceholder')}
                className="flex-1 bg-transparent py-4 pl-3 pr-4 text-sm text-foreground placeholder:text-foreground/30 outline-none"
              />
              {/* Glassmorphism button */}
              <button
                type="submit"
                className={cn(
                  'm-1.5 rounded-xl px-6 py-2.5 text-sm font-bold',
                  'bg-primary-500/15 backdrop-blur-md',
                  'border border-primary-500/40',
                  'text-primary-700 dark:text-primary-300',
                  'shadow-md shadow-primary-500/10',
                  'transition-all hover:bg-primary-500/25 hover:border-primary-500/60 hover:shadow-[0_0_20px_rgba(5,150,105,0.3)]',
                )}
              >
                {t('landing.hero.searchButton')}
              </button>
            </div>
          </motion.form>

          {/* Quick filter chips — glassmorphism */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-10 flex flex-nowrap justify-center gap-2 overflow-x-auto pb-1"
          >
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.param}
                onClick={() => handleQuickFilter(f.param)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 whitespace-nowrap',
                  'rounded-full px-4 py-2 text-sm',
                  'border border-white/50 dark:border-white/10',
                  'bg-white/30 dark:bg-white/5',
                  'backdrop-blur-md',
                  'text-foreground/60 dark:text-white/50',
                  'transition-all hover:bg-primary-500/10 hover:border-primary-500/50 hover:text-primary-600 dark:hover:text-primary-400',
                )}
              >
                <f.icon size={12} />
                {t(f.labelKey)}
              </button>
            ))}
          </motion.div>

          {/* Featured event card — hiện trong hero, không override toàn bộ */}
          {featuredEvent && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mx-auto max-w-2xl"
            >
              <Link
                to={`/events/${featuredEvent.slug}`}
                className={cn(
                  'group relative flex items-center gap-4 overflow-hidden rounded-2xl p-4',
                  'border border-white/50 dark:border-white/10',
                  'bg-white/35 dark:bg-white/5',
                  'backdrop-blur-xl',
                  'shadow-xl shadow-black/8 dark:shadow-black/30',
                  'transition-all hover:border-primary-500/60 hover:shadow-[0_8px_40px_rgba(5,150,105,0.15)]',
                )}
              >
                {/* Thumbnail */}
                {(featuredEvent.thumbnail_url || featuredEvent.banner_url) && (
                  <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={featuredEvent.thumbnail_url || featuredEvent.banner_url}
                      alt={featuredEvent.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500" />
                    {t('landing.hero.featured')}
                  </p>
                  <p className="truncate text-sm font-bold text-foreground">{featuredEvent.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays size={10} />{formatDate(featuredEvent.start_time)}</span>
                    {featuredEvent.venue && <span className="flex items-center gap-1"><MapPin size={10} />{featuredEvent.venue.name}</span>}
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-shrink-0 items-center gap-3">
                  {featuredEvent.minPrice != null && featuredEvent.minPrice > 0 && (
                    <span className="text-sm font-bold text-primary-500">
                      {formatCurrency(featuredEvent.minPrice)}
                    </span>
                  )}
                  <span className="flex items-center gap-1 rounded-full btn-glass px-4 py-2 text-xs font-bold transition-all group- group-hover:shadow-[0_0_20px_rgba(5,150,105,0.4)]">
                    {t('detail.selectSeat')} <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
