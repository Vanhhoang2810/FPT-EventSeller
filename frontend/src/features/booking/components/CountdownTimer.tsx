import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../shared/utils/cn';

interface CountdownTimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const { t } = useTranslation('booking');
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );
  // Dùng ref để onExpire không gây restart interval khi re-render
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    // Reset khi expiresAt thay đổi
    const initial = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    setSecondsLeft(initial);
    if (initial <= 0) { onExpireRef.current?.(); return; }

    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [expiresAt]); // secondsLeft và onExpire KHÔNG trong deps — tránh restart mỗi tick

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isCritical = secondsLeft < 30;
  const isWarning = secondsLeft < 120;

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-xl border px-4 py-2 transition-colors',
      isCritical
        ? 'border-error/50 bg-error/5 text-error animate-pulse'
        : isWarning
          ? 'border-warning/50 bg-warning/5 text-warning'
          : 'border-border bg-secondary text-foreground',
    )}>
      <Clock size={16} />
      <span className="font-mono text-xl font-bold tracking-wider">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      <span className="text-xs text-muted-foreground">{t('countdown.minutesSeconds')}</span>
    </div>
  );
}
