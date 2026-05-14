import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGetEventSuggestionsQuery } from '../services/eventsApi';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { cn } from '../../../shared/utils/cn';
import { Link } from 'react-router-dom';

interface EventSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSearch: (v: string) => void;
  placeholder?: string;
}

export function EventSearchBar({ value, onChange, onSearch, placeholder }: EventSearchBarProps) {
  const { t } = useTranslation('events');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQ = useDebounce(value, 300);

  const { data: suggestions, isFetching } = useGetEventSuggestionsQuery(debouncedQ, {
    skip: debouncedQ.length < 2,
  });

  const results = suggestions?.data ?? [];

  useEffect(() => {
    setOpen(debouncedQ.length >= 2 && results.length > 0);
  }, [debouncedQ, results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { onSearch(value); setOpen(false); }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0 && value.length >= 2) setOpen(true); }}
          placeholder={placeholder || t('search.placeholder')}
          className={cn(
            'w-full rounded-xl border border-border bg-secondary pl-9 pr-9 py-2.5 text-sm text-foreground',
            'placeholder:text-muted-foreground/50 outline-none focus:border-border/60 focus:ring-2 focus:ring-primary-600/20',
          )}
        />
        {value && (
          <button onClick={() => { onChange(''); onSearch(''); setOpen(false); }} className="absolute right-3 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl">
          {isFetching && <p className="px-3 py-2 text-xs text-muted-foreground">{t('search.searching')}</p>}
          {results.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.slug}`}
              onClick={() => { setOpen(false); onChange(event.title); }}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
            >
              {event.thumbnail_url && (
                <img src={event.thumbnail_url} alt="" className="h-8 w-12 rounded object-cover" />
              )}
              <div>
                <p className="font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">{t('categories.' + event.category, { defaultValue: event.category })}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
