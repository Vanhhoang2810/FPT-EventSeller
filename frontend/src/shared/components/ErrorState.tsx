import { AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function ErrorState({ title, description, action, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
        <AlertTriangle size={28} className="text-error/70" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-medium text-foreground">{title ?? 'Đã xảy ra lỗi'}</p>
        {description && <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
