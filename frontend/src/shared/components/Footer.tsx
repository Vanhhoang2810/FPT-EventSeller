import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../constants/routes';
import { Logo } from './Logo';

export function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground max-w-xs">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-3 text-muted-foreground">
              <span className="text-xs">{t('footer.copyright', { year: new Date().getFullYear() })}</span>
            </div>
          </div>

          {/* Events */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{t('footer.events')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to={ROUTES.EVENTS} className="text-muted-foreground hover:text-primary-400 transition-colors">{t('footer.allEvents')}</Link></li>
              <li><Link to={`${ROUTES.EVENTS}?status=on_sale`} className="text-muted-foreground hover:text-primary-400 transition-colors">{t('footer.onSale')}</Link></li>
              <li><Link to={`${ROUTES.EVENTS}?sort=trending`} className="text-muted-foreground hover:text-primary-400 transition-colors">{t('footer.trending')}</Link></li>
              <li><Link to={`${ROUTES.EVENTS}?status=published`} className="text-muted-foreground hover:text-primary-400 transition-colors">{t('footer.comingSoon')}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to={ROUTES.FAQ} className="text-muted-foreground hover:text-primary-400 transition-colors">{t('footer.faq')}</Link></li>
              <li><Link to={ROUTES.CONTACT} className="text-muted-foreground hover:text-primary-400 transition-colors">{t('footer.contact')}</Link></li>
              <li><Link to={ROUTES.TERMS} className="text-muted-foreground hover:text-primary-400 transition-colors">{t('footer.terms')}</Link></li>
              <li><Link to={ROUTES.PRIVACY} className="text-muted-foreground hover:text-primary-400 transition-colors">{t('footer.privacy')}</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
