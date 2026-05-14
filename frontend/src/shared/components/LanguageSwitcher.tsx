import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '../utils/cn';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('vi') ? 'vi' : 'en';

  const toggle = () => {
    const next = current === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(next);
    localStorage.setItem('Ticket Rush_lang', next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Chuyển sang ${current === 'vi' ? 'English' : 'Tiếng Việt'}`}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium',
        'text-muted-foreground transition-colors icon-glass',
        className,
      )}
    >
      <Globe size={14} />
      <span>{current === 'vi' ? 'VI' : 'EN'}</span>
    </button>
  );
}
