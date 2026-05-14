import { type LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  iconClassName?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className, iconClassName }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}>
      <div className={cn('flex h-16 w-16 items-center justify-center rounded-full bg-secondary', iconClassName)}>
        <Icon size={28} className="text-muted-foreground/40" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
