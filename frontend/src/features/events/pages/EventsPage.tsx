import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';
import { useGetEventsQuery } from '../services/eventsApi';
import { EventCard } from '../components/EventCard';
import { EventSearchBar } from '../components/EventSearchBar';
import { CATEGORY_ICONS } from '../../../shared/utils/validators';
import { cn } from '../../../shared/utils/cn';

const CATEGORIES = ['music', 'sports', 'theater', 'comedy', 'festival', 'conference', 'other'];

export function EventsPage() {
  const { t } = useTranslation('events');
  usePageMeta({ title: t('title'), description: t('page.metaDescription') });
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const currentPage = Number(params.get('page') ?? 1);
  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? 'soonest';
  const search = params.get('search') ?? '';

  const SORT_OPTIONS = [
    { value: 'soonest', label: t('sort.soonest') },
    { value: 'newest', label: t('sort.newest') },
    { value: 'trending', label: t('sort.trending') },
  ];

  const { data, isLoading, isFetching } = useGetEventsQuery({ page: currentPage, limit: 12, ...(search && { search }), ...(category && { category }), sort });
  const events = data?.data ?? [];
  const pagination = data?.pagination;

  const update = (k: string, v: string | null) => {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v); else n.delete(k);
    n.set('page', '1');
    setParams(n);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-4 text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{t('title')}</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <EventSearchBar value={searchInput} onChange={setSearchInput} onSearch={(q) => { update('search', q || null); setSearchInput(q); }} />
            </div>
            <select
              value={sort}
              onChange={(e) => update('sort', e.target.value)}
              className="appearance-none rounded-xl border border-border bg-secondary px-3 py-2.5 pr-8 text-sm text-foreground outline-none focus:border-border/60 transition-colors cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => update('category', null)} className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-colors', !category ? 'btn-glass' : 'border border-border text-muted-foreground hover:border-primary-600/50')}>{t('categories.all')}</button>
            {CATEGORIES.map((c) => {
              const CatIcon = CATEGORY_ICONS[c];
              return (
                <button key={c} onClick={() => update('category', c)} className={cn('flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors', category === c ? 'btn-glass' : 'border border-border text-muted-foreground hover:border-primary-600/50')}>
                  {CatIcon && <CatIcon size={13} />} {t('categories.' + c)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[4/5] rounded-xl skeleton" />)}</div>
        ) : events.length === 0 && !isFetching ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary"><Search size={28} className="text-muted-foreground/40" /></div><p className="text-lg font-medium">{t('search.noResult')}</p><p className="text-sm text-muted-foreground">{t('search.tryOther')}</p></div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {search
                ? t('page.resultSummaryFor', { count: pagination?.total || 0, query: search })
                : t('page.resultSummary', { count: pagination?.total || 0 })}
            </p>
            {/* isFetching (page change): giữ grid cũ + overlay nhẹ thay vì flash skeleton */}
            <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 transition-opacity ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>{events.map((event) => <EventCard key={event.id} event={event} />)}</div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1">
                <button
                  onClick={() => { const n = new URLSearchParams(params); n.set('page', String(currentPage - 1)); setParams(n); }}
                  disabled={currentPage <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground icon-glass transition-colors disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(pagination.totalPages, 7) }).map((_, i) => {
                  // Hiện 7 trang xung quanh trang hiện tại
                  const start = Math.max(1, Math.min(currentPage - 3, pagination.totalPages - 6));
                  const p = start + i;
                  if (p > pagination.totalPages) return null;
                  return (
                    <button key={p} onClick={() => { const n = new URLSearchParams(params); n.set('page', String(p)); setParams(n); }}
                      className={cn('h-9 w-9 rounded-lg text-sm font-medium transition-colors', currentPage === p ? 'btn-glass' : 'border border-border text-muted-foreground hover:bg-secondary')}>
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => { const n = new URLSearchParams(params); n.set('page', String(currentPage + 1)); setParams(n); }}
                  disabled={currentPage >= pagination.totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground icon-glass transition-colors disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
