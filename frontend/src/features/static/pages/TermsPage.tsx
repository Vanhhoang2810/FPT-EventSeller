import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';

type Section = { title: string; content: string };

export function TermsPage() {
  const { t } = useTranslation('common');
  usePageMeta({ title: t('footer.terms') });
  const sections = t('pages.terms.sections', { returnObjects: true }) as Section[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <div className="mb-10">
        <h1 className="mb-2 text-4xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('pages.terms.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('pages.terms.lastUpdated')}</p>
      </div>

      <div className="space-y-8">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="mb-2 text-base font-semibold text-foreground">{s.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          {t('pages.terms.contactNote')}{' '}
          <a href="mailto:legal@ticketrush.vn" className="text-primary-700 dark:text-primary-400 hover:underline">legal@ticketrush.vn</a>
        </p>
      </div>
    </div>
  );
}
