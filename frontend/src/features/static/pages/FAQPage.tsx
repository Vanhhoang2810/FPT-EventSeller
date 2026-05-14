import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';
import { Accordion } from '@/shared/components/ui/accordion';

type FaqItem = { q: string; a: string };

const CATEGORY_KEYS = ['booking', 'payment', 'ticketCheckin'] as const;

export function FAQPage() {
  const { t } = useTranslation('common');
  usePageMeta({ title: t('nav.faq') });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('pages.faq.title')}
        </h1>
        <p className="text-muted-foreground">{t('pages.faq.subtitle')}</p>
      </div>

      <div className="space-y-8">
        {CATEGORY_KEYS.map((catKey) => {
          const raw = t(`pages.faq.items.${catKey}`, { returnObjects: true });
          const items = Array.isArray(raw) ? raw as FaqItem[] : [];
          return (
            <div key={catKey}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t(`pages.faq.categories.${catKey}`)}
              </h2>
              <Accordion
                items={items.map((item, i) => ({
                  id: `${catKey}-${i}`,
                  trigger: item.q,
                  content: item.a,
                }))}
                type="single"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-12 rounded-2xl border border-primary-600/20 bg-primary-600/5 p-6 text-center">
        <p className="mb-3 text-sm font-medium text-foreground">{t('pages.faq.notFound')}</p>
        <a href="/contact" className="text-sm text-primary-700 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 underline underline-offset-2 transition-colors">
          {t('pages.faq.contactSupport')}
        </a>
      </div>
    </div>
  );
}
