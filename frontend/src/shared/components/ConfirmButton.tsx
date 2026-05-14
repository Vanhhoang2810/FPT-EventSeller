import { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';

interface ConfirmButtonProps {
  onConfirm: () => void;
  label: string;
  confirmLabel?: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * Nút 2-bước thay thế window.confirm() — click lần 1 hiện xác nhận,
 * click lần 2 thực thi. Click ra ngoài = hủy.
 */
export function ConfirmButton({
  onConfirm, label, confirmLabel = 'Xác nhận', className, children, disabled,
}: ConfirmButtonProps) {
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pending) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPending(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pending]);

  if (!pending) {
    return (
      <button
        disabled={disabled}
        onClick={() => setPending(true)}
        className={className}
        title={label}
      >
        {children}
      </button>
    );
  }

  return (
    <div ref={ref} className="flex items-center gap-1">
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{confirmLabel}?</span>
      <button
        onClick={() => { setPending(false); onConfirm(); }}
        className="rounded-md bg-destructive px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-destructive/80 transition-colors"
      >
        Có
      </button>
      <button
        onClick={() => setPending(false)}
        className="rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground icon-glass transition-colors"
      >
        Không
      </button>
    </div>
  );
}
