import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight size={14} className="opacity-40" />}
            {isLast || !item.href ? (
              <span className={cn(isLast ? 'font-medium opacity-100' : 'opacity-70')}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="opacity-60 transition-opacity hover:opacity-90"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
