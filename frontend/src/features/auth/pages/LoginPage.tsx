import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoginMutation } from '../services/authApi';
import { setCredentials } from '../store/authSlice';
import { broadcastAuth } from '../../../app/SessionProvider';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { CaptchaWidget } from '../components/CaptchaWidget';
import { ROUTES } from '../../../shared/constants/routes';
import { toast } from 'sonner';
import { cn } from '../../../shared/utils/cn';

const loginSchema = z.object({
  email: z.string().email('auth:errors.invalidEmail'),
  password: z.string().min(1, 'auth:errors.requiredPassword'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation('auth');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.HOME;

  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await login({ ...data, turnstileToken: captchaToken ?? undefined }).unwrap();
      dispatch(setCredentials({ accessToken: result.accessToken, user: result.user }));
      broadcastAuth('login'); // notify các tab khác
      toast.success(t('login.toast.success'));
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message || t('login.toast.error');
      toast.error(message);
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-center text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
        {t('login.title')}
      </h2>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {t('login.subtitle')}
      </p>

      {/* Google Login Button — nổi bật ở trên */}
      <div className="mb-4">
        <GoogleLoginButton redirectTo={from} />
      </div>

      <div className="relative mb-4 flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="mx-3 text-xs text-muted-foreground">{t('login.or')}</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('login.email')}</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              {...register('email')}
              type="email"
              placeholder="email@example.com"
              autoComplete="email"
              className={cn(
                'w-full rounded-lg border bg-secondary px-4 py-2.5 pl-10 text-sm text-foreground',
                'placeholder:text-muted-foreground/50 outline-none',
                'focus:border-border/60 focus:ring-2 focus:ring-primary-600/20',
                errors.email ? 'border-error' : 'border-border',
              )}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-error">{t(errors.email.message as string)}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('login.password')}</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className={cn(
                'w-full rounded-lg border bg-secondary px-4 py-2.5 pl-10 pr-10 text-sm text-foreground',
                'placeholder:text-muted-foreground/50 outline-none',
                'focus:border-border/60 focus:ring-2 focus:ring-primary-600/20',
                errors.password ? 'border-error' : 'border-border',
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-error">{t(errors.password.message as string)}</p>}
        </div>

        {/* Remember me + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input {...register('rememberMe')} type="checkbox" className="rounded border-border accent-primary-600" />
            {t('login.rememberMe')}
          </label>
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm text-primary-700 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300">
            {t('login.forgotPassword')}
          </Link>
        </div>

        {/* Turnstile CAPTCHA */}
        <CaptchaWidget
          onVerify={(token) => setCaptchaToken(token)}
          onExpire={() => setCaptchaToken(null)}
        />

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full rounded-lg px-4 py-3 text-base font-semibold',
            'btn-glass',
            'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {isLoading ? t('login.submitting') : t('login.submit')}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-primary-700 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300">
          {t('login.registerNow')}
        </Link>
      </p>
    </div>
  );
}
