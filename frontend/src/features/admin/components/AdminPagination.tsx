import { useTranslation } from 'react-i18next';
import { cn } from '../../../shared/utils/cn';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  label?: string;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
}

export function AdminPagination({ page, totalPages, total, label, onPageChange, showPageNumbers = false }: AdminPaginationProps) {
  const { t } = useTranslation('admin');
  if (totalPages <= 1) return null;

  const btnCls = 'rounded-lg border border-admin-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-foreground/[0.06] disabled:opacity-30 transition-colors';

  const pageLabel = label ?? t('pagination.page');
  const itemsLabel = t('pagination.items');

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground/60">
        {total != null
          ? `${pageLabel} ${page}/${totalPages} · ${total} ${itemsLabel}`
          : `${pageLabel} ${page}/${totalPages}`
        }
      </p>
      <div className="flex gap-1">
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className={btnCls}>
          {t('pagination.prev')}
        </button>

        {showPageNumbers && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = page <= 3 ? i + 1 : page - 2 + i;
          if (p > totalPages) return null;
          return (
            <button key={p} onClick={() => onPageChange(p)}
              className={cn(
                'h-8 w-8 rounded-lg text-xs transition-colors',
                page === p
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground',
              )}>
              {p}
            </button>
          );
        })}

        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className={btnCls}>
          {t('pagination.next')}
        </button>
      </div>
    </div>
  );
}
