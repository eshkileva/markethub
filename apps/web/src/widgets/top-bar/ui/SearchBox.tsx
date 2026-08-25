import { useEffect, useRef, useState } from 'react';
import { Clock, Search, X } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';
import { useSearchHistory } from '@/features/search/model/use-search-history';

export function SearchBox({
  value,
  onChange,
  onSubmit,
  className,
  inputClassName,
  placeholder = 'Найти на Купилко...',
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (queryOverride?: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { items, record, remove, clear } = useSearchHistory();

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, []);

  function submit(queryOverride?: string) {
    const trimmed = (queryOverride ?? value).trim();
    if (trimmed) record(trimmed);
    onSubmit(queryOverride);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn('relative min-w-0 flex-1', className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Search className="text-muted pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2" />
        <Input
          className={cn('border-border bg-background h-11 rounded-2xl pl-10', inputClassName)}
          placeholder={placeholder}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
          autoComplete="off"
        />
      </form>
      {open && items.length > 0 ? (
        <div className="border-border bg-card absolute z-50 mt-1 w-full overflow-hidden rounded-xl border py-1 shadow-md">
          <p className="text-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">
            Недавние запросы
          </p>
          <ul>
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-1">
                <button
                  type="button"
                  className="hover:bg-surface-secondary flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(item.query);
                    submit(item.query);
                  }}
                >
                  <Clock className="text-muted h-4 w-4 shrink-0" />
                  <span className="truncate">{item.query}</span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mr-1 h-8 w-8 shrink-0"
                  aria-label={`Удалить «${item.query}»`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => remove(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="text-muted hover:bg-surface-secondary border-border w-full border-t px-3 py-2 text-left text-xs"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => clear()}
          >
            Очистить историю
          </button>
        </div>
      ) : null}
    </div>
  );
}
