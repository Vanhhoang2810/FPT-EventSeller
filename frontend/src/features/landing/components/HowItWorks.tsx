import { Fragment } from 'react';
import { Search, Armchair, QrCode, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

const STEPS: Array<{ icon: LucideIcon; key: 'step1' | 'step2' | 'step3'; color: string }> = [
  { icon: Search,  key: 'step1', color: 'from-primary-600 to-primary-500' },
  { icon: Armchair, key: 'step2', color: 'from-primary-500 to-accent-500' },
  { icon: QrCode,  key: 'step3', color: 'from-accent-500 to-accent-400' },
];

export function HowItWorks() {
  const { t } = useTranslation('events');

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          {/* Gradient top bar */}
          <div className="h-px w-full bg-gradient-to-r from-primary-600 via-accent-500 to-primary-400 opacity-60" />

          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="mb-10 text-center">
              <h2
                className="text-2xl font-black tracking-tight md:text-3xl"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {t('landing.howItWorks.title')}
              </h2>
            </div>

            {/* Desktop: horizontal */}
            <div className="hidden sm:flex sm:items-start sm:justify-center sm:gap-4">
              {STEPS.map((step, i) => (
                <Fragment key={step.key}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.12 }}
                    className="flex w-44 flex-col items-center gap-3 text-center"
                  >
                    {/* Icon — glassmorphism */}
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
                      style={{
                        background: step.key === 'step1'
                          ? 'rgba(5,150,105,0.15)' : step.key === 'step2'
                          ? 'rgba(5,150,105,0.12)' : 'rgba(249,115,22,0.15)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: `1px solid ${step.key === 'step3' ? 'rgba(249,115,22,0.3)' : 'rgba(16,185,129,0.25)'}`,
                      }}
                    >
                      <step.icon size={24} className={step.key === 'step3' ? 'text-accent-500' : 'text-primary-500'} />
                    </div>

                    {/* Step number */}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                      0{i + 1}
                    </span>

                    <p className="text-sm font-bold text-foreground leading-tight">
                      {t(`landing.howItWorks.${step.key}.title`)}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t(`landing.howItWorks.${step.key}.desc`)}
                    </p>
                  </motion.div>

                  {i < STEPS.length - 1 && (
                    <div key={`sep-${i}`} className="mt-6 flex-shrink-0">
                      <ChevronRight size={18} className="text-border" />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>

            {/* Mobile: vertical */}
            <div className="flex flex-col gap-6 sm:hidden">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex flex-col items-center gap-2 text-center">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      background: step.key === 'step3' ? 'rgba(249,115,22,0.15)' : 'rgba(5,150,105,0.15)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: `1px solid ${step.key === 'step3' ? 'rgba(249,115,22,0.3)' : 'rgba(16,185,129,0.25)'}`,
                    }}
                  >
                    <step.icon size={22} className={step.key === 'step3' ? 'text-accent-500' : 'text-primary-500'} />
                  </div>
                  <p className="text-sm font-bold text-foreground">{t(`landing.howItWorks.${step.key}.title`)}</p>
                  <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">{t(`landing.howItWorks.${step.key}.desc`)}</p>
                  {i < STEPS.length - 1 && <ChevronDown size={16} className="text-border" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
