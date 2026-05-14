import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResetPasswordMutation } from '../services/authApi';
import { ROUTES } from '../../../shared/constants/routes';
import { toast } from 'sonner';
import { cn } from '../../../shared/utils/cn';

const schema = z.object({
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
}).required();
type ResetForm = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [reset, { isLoading, isSuccess }] = useResetPasswordMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ResetForm) => {
    if (!token) return; // guard Enter key khi token vắng mặt
    try {
      await reset({ token, newPassword: data.newPassword }).unwrap();
      toast.success(t('resetPassword.toast.success'));
    } catch {
      toast.error(t('resetPassword.toast.error'));
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h2 className="mb-2 text-xl font-bold">{t('resetPassword.successTitle')}</h2>
        <Link to={ROUTES.LOGIN} className="text-primary-700 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 text-sm">{t('resetPassword.loginNow')}</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold">{t('resetPassword.title')}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t('resetPassword.newPassword')}</label>
          <input
            {...register('newPassword')}
            type="password"
            placeholder={t('resetPassword.newPasswordHint')}
            className={cn(
              'w-full rounded-lg border bg-secondary px-4 py-2.5 text-sm text-foreground outline-none',
              'focus:border-border/60 focus:ring-2 focus:ring-primary-600/20',
              errors.newPassword ? 'border-error' : 'border-border',
            )}
          />
          {errors.newPassword && <p className="mt-1 text-xs text-error">{t('resetPassword.newPasswordError')}</p>}
        </div>
        <button type="submit" disabled={isLoading || !token} className={cn(
          'w-full rounded-lg btn-glass px-4 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50',
        )}>
          {isLoading ? t('resetPassword.submitting') : t('resetPassword.submit')}
        </button>
      </form>
    </div>
  );
}
