import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';

type Section = { title: string; content: string };

export function PrivacyPage() {
  const { t } = useTranslation('common');
  usePageMeta({ title: t('footer.privacy') });
  const sections = t('pages.privacy.sections', { returnObjects: true }) as Section[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <div className="mb-10">
        <h1 className="mb-2 text-4xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('pages.privacy.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('pages.privacy.lastUpdated')}</p>
      </div>

      <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
        {t('pages.privacy.intro')}
      </p>

      <div className="space-y-8">
        {sections.map((s) => (
          <div key={s.title} className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-semibold text-foreground">{s.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        {t('pages.privacy.contactNote')}{' '}
        <a href="mailto:privacy@ticketrush.vn" className="text-primary-700 dark:text-primary-400 hover:underline">privacy@ticketrush.vn</a>
      </div>
    </div>
  );
}
