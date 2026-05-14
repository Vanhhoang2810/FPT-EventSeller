import { useState } from 'react';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';
import { Mail, MessageSquare, Phone, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function ContactPage() {
  const { t } = useTranslation('common');
  usePageMeta({ title: t('footer.contact') });
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const CONTACTS = [
    { icon: Mail,          key: 'email',  value: 'support@ticketrush.vn',  href: 'mailto:support@ticketrush.vn' },
    { icon: Phone,         key: 'phone',  value: '1900 1234',              href: 'tel:19001234' },
    { icon: Clock,         key: 'hours',  value: t('pages.contact.contacts.hours.value'), href: null },
    { icon: MessageSquare, key: 'chat',   value: t('pages.contact.contacts.chat.value'),  href: null },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error(t('pages.contact.toast.required')); return; }
    setSending(true);
    // Giả lập gửi (chưa có endpoint thật)
    await new Promise((r) => setTimeout(r, 1200));
    toast.success(t('pages.contact.toast.success'));
    setForm({ name: '', email: '', subject: '', message: '' });
    setSending(false);
  };

  const INPUT = 'w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-border/60 focus:ring-2 focus:ring-primary-600/20 transition-colors';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('pages.contact.title')}
        </h1>
        <p className="text-muted-foreground">{t('pages.contact.subtitle')}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contact info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('pages.contact.infoTitle')}</h2>
          {CONTACTS.map(({ icon: Icon, key, value, href }) => (
            <div key={key} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600/10">
                <Icon size={18} className="text-primary-700 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t(`pages.contact.contacts.${key}.label`)}</p>
                {href ? (
                  <a href={href} className="text-sm font-medium text-foreground hover:text-primary-700 dark:text-primary-400 transition-colors">{value}</a>
                ) : (
                  <p className="text-sm font-medium text-foreground">{value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t('pages.contact.formTitle')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-xs text-muted-foreground">{t('pages.contact.labels.name')}</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={INPUT} placeholder={t('pages.contact.placeholders.name')} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-xs text-muted-foreground">{t('pages.contact.labels.email')}</label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className={INPUT} placeholder="email@example.com" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">{t('pages.contact.labels.subject')}</label>
              <input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                className={INPUT} placeholder={t('pages.contact.placeholders.subject')} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">{t('pages.contact.labels.message')}</label>
              <textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                rows={5} className={`${INPUT} resize-none`} placeholder={t('pages.contact.placeholders.message')} />
            </div>
            <button type="submit" disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl btn-glass py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-colors">
              {sending ? t('pages.contact.sending') : <><Send size={14} /> {t('pages.contact.send')}</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
