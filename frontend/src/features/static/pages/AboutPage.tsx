import { motion } from 'framer-motion';
import { Ticket, Shield, Zap, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';

const STATS = [
  { value: '500+', key: 'events' },
  { value: '100K+', key: 'tickets' },
  { value: '50K+', key: 'users' },
  { value: '99.9%', key: 'uptime' },
] as const;

const VALUES = [
  { icon: Zap,    key: 'fast' },
  { icon: Shield, key: 'secure' },
  { icon: Ticket, key: 'experience' },
  { icon: Users,  key: 'community' },
] as const;

export function AboutPage() {
  const { t } = useTranslation('common');
  usePageMeta({ title: t('pages.about.title') });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('pages.about.titlePrefix')} <span className="text-primary-500">Ticket</span> <span className="text-accent-500">Rush</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
          {t('pages.about.subtitle')}
        </p>
      </motion.div>

      <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div key={s.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-3xl font-black" style={{
              fontFamily: 'var(--font-heading)',
              background: i % 2 === 0 ? 'linear-gradient(135deg, #10B981, #34D399)' : 'linear-gradient(135deg, #F97316, #FBBF24)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t(`pages.about.stats.${s.key}`)}</p>
          </motion.div>
        ))}
      </div>

      <div className="mb-16 rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="mb-3 text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{t('pages.about.mission.title')}</h2>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {t('pages.about.mission.desc')}
        </p>
      </div>

      <div>
        <h2 className="mb-8 text-center text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{t('pages.about.values.title')}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {VALUES.map(({ icon: Icon, key }, i) => (
            <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.08 }}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600/10">
                <Icon size={18} className="text-primary-700 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">{t(`pages.about.values.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`pages.about.values.${key}.desc`)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
