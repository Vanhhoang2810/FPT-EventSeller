import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVerifyEmailMutation } from '../services/authApi';
import { ROUTES } from '../../../shared/constants/routes';

export function EmailVerifyPage() {
  const { t } = useTranslation('auth');
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [verify] = useVerifyEmailMutation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    verify({ token }).unwrap()
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token, verify]);

  return (
    <div className="text-center">
      {status === 'loading' && (
        <>
          <div className="mb-4 w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">{t('verifyEmail.verifying')}</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="mb-4 text-4xl">✅</div>
          <h2 className="mb-2 text-xl font-bold">{t('verifyEmail.successTitle')}</h2>
          <Link to={ROUTES.HOME} className="text-primary-700 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 text-sm">{t('verifyEmail.home')}</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="mb-4 text-4xl">❌</div>
          <h2 className="mb-2 text-xl font-bold text-error">{t('verifyEmail.errorTitle')}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{t('verifyEmail.errorDesc')}</p>
          <Link to={ROUTES.HOME} className="text-primary-700 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 text-sm">{t('verifyEmail.home')}</Link>
        </>
      )}
    </div>
  );
}
