import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useState, useRef } from 'react';
import { IMaskInput } from 'react-imask';
import { User, Mail, Phone, Lock, Save, Ticket, Bell, CheckCircle, Camera, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { selectCurrentUser, selectAccessToken, setUser } from '../../auth/store/authSlice';
import type { AuthUser } from '../../auth/store/authSlice';
import { cn } from '../../../shared/utils/cn';
import { toast } from 'sonner';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { Tabs } from '../../../shared/components/ui/tabs';

type Tab = 'profile' | 'history' | 'notifications';

interface ProfileForm { fullName: string; gender: string; dateOfBirth: string }
interface PasswordForm { currentPassword: string; newPassword: string; confirmPassword: string }
interface BookingItem {
  id: number; status: string; total_amount: number; seat_count: number;
  created_at: string; event?: { title: string; slug: string; start_time: string };
}

const INPUT = cn(
  'w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground',
  'outline-none focus:border-border/60 focus:ring-2 focus:ring-primary-600/20 transition-colors',
);

export function ProfilePage() {
  const { t } = useTranslation('common');
  usePageMeta({ title: t('profile.title') });
  const user = useSelector(selectCurrentUser);
  const accessToken = useSelector(selectAccessToken);
  const dispatch = useDispatch();
  const [tab, setTab] = useState<Tab>('profile');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [bookings, setBookings] = useState<BookingItem[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    email_booking: true, email_reminder: true, email_news: false,
  });
  const [notifLoaded, setNotifLoaded] = useState(false);
  const [isSavingNotif, setIsSavingNotif] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ảnh tối đa 2MB'); return; }

    setIsUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
        credentials: 'include',
        body: form,
      });
      const json = await res.json();
      if (json.success) {
        dispatch(setUser({ ...user!, avatarUrl: json.data.avatarUrl }));
        toast.success('Cập nhật ảnh đại diện thành công');
      } else toast.error(json.message || 'Upload thất bại');
    } catch { toast.error('Upload thất bại'); }
    finally { setIsUploadingAvatar(false); e.target.value = ''; }
  };

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      fullName: user?.fullName ?? '',
      gender: user?.gender ?? '',
      dateOfBirth: user?.dateOfBirth?.slice(0, 10) ?? '',
    },
  });
  const passwordForm = useForm<PasswordForm>({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken ?? ''}` };

  const STATUS_MAP = {
    confirmed: { label: t('profile.bookingStatus.confirmed'), cls: 'bg-success/10 text-success' },
    pending:   { label: t('profile.bookingStatus.pending'),   cls: 'bg-warning/10 text-warning' },
    expired:   { label: t('profile.bookingStatus.expired'),   cls: 'bg-secondary text-muted-foreground' },
    cancelled: { label: t('profile.bookingStatus.cancelled'), cls: 'bg-error/10 text-error' },
  } as const;

  const TABS: { key: Tab; label: string; icon: typeof User }[] = [
    { key: 'profile',       label: t('profile.tabs.profile'),       icon: User },
    { key: 'history',       label: t('profile.tabs.history'),        icon: Ticket },
    { key: 'notifications', label: t('profile.tabs.notifications'),  icon: Bell },
  ];

  const handleSaveProfile = async (data: ProfileForm) => {
    if (!data.fullName.trim()) { toast.error(t('profile.toast.fullNameRequired')); return; }
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT', headers, credentials: 'include',
        body: JSON.stringify({
          fullName: data.fullName,
          phone,
          gender: data.gender || null,
          dateOfBirth: data.dateOfBirth || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        dispatch(setUser({
          ...user!,
          fullName: data.fullName,
          phone: phone || null,
          gender: (data.gender as AuthUser['gender']) || null,
          dateOfBirth: data.dateOfBirth || null,
        }));
        toast.success(t('profile.toast.profileSaved'));
      } else toast.error(json.message || t('profile.toast.profileFailed'));
    } catch { toast.error(t('profile.toast.genericError')); }
    finally { setIsSavingProfile(false); }
  };

  const handleChangePassword = async (data: PasswordForm) => {
    if (data.newPassword.length < 8) { toast.error(t('profile.toast.passwordTooShort')); return; }
    if (data.newPassword !== data.confirmPassword) { toast.error(t('profile.toast.passwordMismatch')); return; }
    setIsSavingPassword(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'PUT', headers, credentials: 'include',
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      const json = await res.json();
      if (json.success) { toast.success(t('profile.toast.passwordChanged')); passwordForm.reset(); }
      else toast.error(json.message || t('profile.toast.passwordFailed'));
    } catch { toast.error(t('profile.toast.genericError')); }
    finally { setIsSavingPassword(false); }
  };

  const loadBookings = async () => {
    if (bookings !== null) return; // cache — chỉ load 1 lần
    setBookingsLoading(true);
    try {
      const res = await fetch('/api/bookings?limit=20', { headers, credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setBookings(json.success ? (json.data ?? []) : []);
    } catch { setBookings([]); toast.error(t('profile.toast.genericError')); }
    finally { setBookingsLoading(false); }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotif(true);
    try {
      const res = await fetch('/api/users/notification-settings', {
        method: 'PUT', headers, credentials: 'include',
        body: JSON.stringify(notifSettings),
      });
      const json = await res.json();
      if (json.success) toast.success(t('profile.toast.notifSaved'));
      else toast.error(json.message || t('profile.toast.notifFailed'));
    } catch { toast.error(t('profile.toast.genericError')); }
    finally { setIsSavingNotif(false); }
  };

  const handleTabChange = (tabKey: Tab) => {
    setTab(tabKey);
    if (tabKey === 'history') loadBookings();
    if (tabKey === 'notifications' && !notifLoaded) loadNotifSettings();
  };

  const loadNotifSettings = async () => {
    setNotifLoaded(true);
    try {
      const res = await fetch('/api/users/notification-settings', { headers, credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) setNotifSettings(json.data);
      }
    } catch { /* dùng defaults */ }
  };

  const initials = user?.fullName?.split(' ').slice(-1)[0]?.charAt(0).toUpperCase() ?? 'U';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      {/* Avatar + name */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="h-16 w-16 rounded-2xl overflow-hidden bg-primary-500/15 backdrop-blur-md border border-primary-500/30 shadow-sm">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-primary-700 dark:text-primary-300 text-2xl font-bold">
                {initials}
              </div>
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                <Loader2 size={20} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md transition-all disabled:opacity-50"
            style={{
              background: 'rgba(5,150,105,0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(16,185,129,0.5)',
            }}
            title={t('profile.changeAvatar')}
          >
            <Camera size={12} />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {user?.fullName}
          </h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          {user?.emailVerified && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              <CheckCircle size={10} /> {t('profile.emailVerified')}
            </span>
          )}
        </div>
      </div>

      {/* Tab selector */}
      <Tabs tabs={TABS} activeTab={tab} onChange={handleTabChange} className="mb-6" />

      {/* ── Hồ sơ ── */}
      {tab === 'profile' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <User size={15} className="text-primary-400" /> {t('profile.personalInfo')}
            </h2>
            <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('profile.email')}</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={user?.email ?? ''} readOnly className={cn(INPUT, 'pl-9 opacity-60 cursor-not-allowed')} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('profile.fullName')}</label>
                <input {...profileForm.register('fullName')} className={INPUT} placeholder={t('profile.fullNamePlaceholder')} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('profile.phone')}</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <IMaskInput
                    mask="0000 000 000"
                    value={phone}
                    onAccept={(v: string) => setPhone(v)}
                    className={cn(INPUT, 'pl-9')}
                    placeholder={t('profile.phonePlaceholder')}
                    type="tel"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('profile.gender')}</label>
                  <select {...profileForm.register('gender')} className={cn(INPUT, 'bg-secondary')}>
                    <option value="">{t('profile.genderPlaceholder')}</option>
                    <option value="male">{t('profile.genderMale')}</option>
                    <option value="female">{t('profile.genderFemale')}</option>
                    <option value="other">{t('profile.genderOther')}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('profile.dateOfBirth')}</label>
                  <input
                    {...profileForm.register('dateOfBirth')}
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    className={cn(INPUT, 'text-foreground')}
                  />
                </div>
              </div>
              <button type="submit" disabled={isSavingProfile}
                className="flex items-center gap-2 rounded-xl btn-glass px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-colors">
                <Save size={13} />
                {isSavingProfile ? t('profile.saving') : t('profile.saveChanges')}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lock size={15} className="text-primary-400" /> {t('profile.changePassword')}
            </h2>
            <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('profile.currentPassword')}</label>
                <input {...passwordForm.register('currentPassword')} type="password" className={INPUT} placeholder="••••••••" autoComplete="current-password" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('profile.newPassword')}</label>
                <input {...passwordForm.register('newPassword')} type="password" className={INPUT} placeholder="••••••••" autoComplete="new-password" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('profile.confirmPassword')}</label>
                <input {...passwordForm.register('confirmPassword')} type="password" className={INPUT} placeholder="••••••••" autoComplete="new-password" />
              </div>
              <button type="submit" disabled={isSavingPassword}
                className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50 transition-colors">
                <Lock size={13} />
                {isSavingPassword ? t('profile.processing') : t('profile.changePasswordBtn')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Lịch sử đặt vé ── */}
      {tab === 'history' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {bookingsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-xl skeleton" />)}
            </div>
          ) : (bookings ?? []).length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <Ticket size={40} className="text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t('profile.historyEmpty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">{t('profile.historyEvent')}</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">{t('profile.historyAmount')}</th>
                  <th className="px-4 py-3 text-center">{t('profile.historyStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {(bookings ?? []).map((b) => {
                  const s = STATUS_MAP[b.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.expired;
                  return (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground line-clamp-1">{b.event?.title ?? t('profile.historyOrderFallback', { id: b.id })}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(b.created_at)} · {t('profile.historySeatCount', { count: b.seat_count })}</p>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell font-medium text-foreground">
                        {formatCurrency(Number(b.total_amount))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', s.cls)}>{s.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          )}
        </div>
      )}

      {/* ── Cài đặt thông báo ── */}
      {tab === 'notifications' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bell size={15} className="text-primary-400" /> {t('profile.notificationSettings')}
          </h2>
          {([
            { key: 'email_booking'  as const, label: t('profile.notif.booking'),  desc: t('profile.notif.bookingDesc') },
            { key: 'email_reminder' as const, label: t('profile.notif.reminder'), desc: t('profile.notif.reminderDesc') },
            { key: 'email_news'     as const, label: t('profile.notif.news'),     desc: t('profile.notif.newsDesc') },
          ]).map(({ key, label, desc }) => (
            <label key={key} className="flex items-center justify-between gap-4 cursor-pointer group">
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary-400 transition-colors">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifSettings[key]}
                onClick={() => setNotifSettings((p) => ({ ...p, [key]: !p[key] }))}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors flex-shrink-0',
                  notifSettings[key] ? 'bg-primary-600' : 'bg-secondary border border-border',
                )}
              >
                <div className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                  notifSettings[key] ? 'translate-x-5' : 'translate-x-0.5',
                )} />
              </button>
            </label>
          ))}
          <button
            onClick={handleSaveNotifications}
            disabled={isSavingNotif}
            className="flex items-center gap-2 rounded-xl btn-glass px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            <Save size={13} /> {isSavingNotif ? t('profile.saving') : t('profile.saveSettings')}
          </button>
        </div>
      )}
    </div>
  );
}
