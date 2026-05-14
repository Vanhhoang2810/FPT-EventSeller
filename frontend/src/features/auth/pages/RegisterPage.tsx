import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterMutation } from '../services/authApi';
import { setCredentials } from '../store/authSlice';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { CaptchaWidget } from '../components/CaptchaWidget';
import { ROUTES } from '../../../shared/constants/routes';
import { toast } from 'sonner';
import { cn } from '../../../shared/utils/cn';

const registerSchema = z.object({
  fullName: z.string().min(2, 'errors:field.fullNameMin'),
  email: z.string().email('errors:field.invalidEmail'),
  password: z
    .string()
    .min(8, 'errors:field.passwordMin')
    .regex(/[A-Z]/, 'errors:field.passwordUppercase')
    .regex(/[0-9]/, 'errors:field.passwordNumber'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'errors:field.passwordMismatch',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const { t: tErr } = useTranslation('errors');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [register, { isLoading }] = useRegisterMutation();

  const { register: reg, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password', '');
  const passwordStrength = (() => {
    if (!passwordValue) return 0;
    let score = 0;
    if (passwordValue.length >= 8) score++;
    if (/[A-Z]/.test(passwordValue)) score++;
    if (/[0-9]/.test(passwordValue)) score++;
    if (/[^A-Za-z0-9]/.test(passwordValue)) score++;
    return score;
  })();

  const onSubmit = async (data: RegisterForm) => {
    try {
      const result = await register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        turnstileToken: captchaToken ?? undefined,
      }).unwrap();
      dispatch(setCredentials({ accessToken: result.accessToken, user: result.user }));
      toast.success(t('register.toast.success'));
      navigate(ROUTES.HOME);
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message || t('register.toast.error');
      toast.error(message);
    }
  };

  // Dịch error key từ errors namespace (format: "errors:field.xxx")
  const translateError = (msg: string | undefined) => {
    if (!msg) return '';
    if (msg.startsWith('errors:')) return tErr(msg.replace('errors:', ''));
    return msg;
  };

  return (
    <div>
      <h2 className="mb-1 text-center text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
        {t('register.title')}
      </h2>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {t('register.subtitle')}
      </p>

      {/* Google Register */}
      <div className="mb-4">
        <GoogleLoginButton label={t('register.withGoogle')} />
      </div>

      <div className="relative mb-4 flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="mx-3 text-xs text-muted-foreground">{t('login.or')}</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('register.fullName')}</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              {...reg('fullName')}
              placeholder={t('register.fullNamePlaceholder')}
              autoComplete="name"
              className={cn(
                'w-full rounded-lg border bg-secondary px-4 py-2.5 pl-10 text-sm text-foreground',
                'placeholder:text-muted-foreground/50 outline-none',
                'focus:border-border/60 focus:ring-2 focus:ring-primary-600/20',
                errors.fullName ? 'border-error' : 'border-border',
              )}
            />
          </div>
          {errors.fullName && <p className="mt-1 text-xs text-error">{translateError(errors.fullName.message)}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('register.email')}</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              {...reg('email')}
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
          {errors.email && <p className="mt-1 text-xs text-error">{translateError(errors.email.message)}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('register.password')}</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              {...reg('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('register.passwordHint')}
              autoComplete="new-password"
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
              aria-label={showPassword ? t('register.hidePassword') : t('register.showPassword')}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Password strength */}
          {passwordValue && (
            <div
              className="mt-2 flex gap-1"
              role="meter"
              aria-label={t('register.passwordStrength')}
              aria-valuenow={passwordStrength}
              aria-valuemin={0}
              aria-valuemax={4}
            >
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    passwordStrength >= level
                      ? level <= 2 ? 'bg-warning' : level === 3 ? 'bg-primary-500' : 'bg-success'
                      : 'bg-secondary',
                  )}
                />
              ))}
            </div>
          )}
          {errors.password && <p className="mt-1 text-xs text-error">{translateError(errors.password.message)}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('register.confirmPassword')}</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              {...reg('confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('register.confirmPasswordPlaceholder')}
              autoComplete="new-password"
              className={cn(
                'w-full rounded-lg border bg-secondary px-4 py-2.5 pl-10 text-sm text-foreground',
                'placeholder:text-muted-foreground/50 outline-none',
                'focus:border-border/60 focus:ring-2 focus:ring-primary-600/20',
                errors.confirmPassword ? 'border-error' : 'border-border',
              )}
            />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-error">{translateError(errors.confirmPassword.message)}</p>}
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
          {isLoading ? t('register.submitting') : t('register.submit')}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t('register.hasAccount')}{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-primary-700 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300">
          {t('register.loginNow')}
        </Link>
      </p>
    </div>
  );
}
