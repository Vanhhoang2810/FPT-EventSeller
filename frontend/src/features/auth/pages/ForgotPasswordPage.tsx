import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useForgotPasswordMutation } from '../services/authApi';
import { ROUTES } from '../../../shared/constants/routes';
import { toast } from 'sonner';
import { cn } from '../../../shared/utils/cn';

const schema = z.object({ email: z.string().email('auth:errors.invalidEmail') });
type ForgotForm = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const [forgot, { isLoading, isSuccess }] = useForgotPasswordMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ForgotForm) => {
    try {
      await forgot(data).unwrap();
      toast.success(t('forgotPassword.toast.success'));
    } catch {
      toast.error(t('forgotPassword.toast.error'));
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="mb-4 text-4xl">📧</div>
        <h2 className="mb-2 text-xl font-bold">{t('forgotPassword.checkEmail')}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t('forgotPassword.emailSent')}</p>
        <Link to={ROUTES.LOGIN} className="text-primary-700 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 text-sm">{t('forgotPassword.backToLogin')}</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-center text-2xl font-bold">{t('forgotPassword.title')}</h2>
      <p className="mb-6 text-center text-sm text-muted-foreground">{t('forgotPassword.subtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('forgotPassword.email')}</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              {...register('email')}
              type="email"
              placeholder="email@example.com"
              className={cn(
                'w-full rounded-lg border bg-secondary px-4 py-2.5 pl-10 text-sm text-foreground',
                'placeholder:text-muted-foreground/50 outline-none focus:border-border/60 focus:ring-2 focus:ring-primary-600/20',
                errors.email ? 'border-error' : 'border-border',
              )}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-error">{t(errors.email.message as string)}</p>}
        </div>

        <button type="submit" disabled={isLoading} className={cn(
          'w-full rounded-lg btn-glass px-4 py-3 text-sm font-semibold',
          'hover:bg-primary-700 disabled:opacity-50',
        )}>
          {isLoading ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link to={ROUTES.LOGIN} className="text-primary-700 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300">{t('forgotPassword.backToLogin')}</Link>
      </p>
    </div>
  );
}
