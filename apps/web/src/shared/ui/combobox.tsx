import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { selectClassName } from '@/shared/ui/native-select';
import { filterComboboxOptions, type ComboboxOption } from '@/shared/ui/combobox-filter';

export type { ComboboxOption };

export function Combobox({
  id,
  value,
  onChange,
  options,
  disabled,
  placeholder = 'Начните вводить…',
  emptyLabel = 'Ничего не найдено',
  allowEmpty = false,
  clearLabel = 'Не выбрано',
  size = 'md',
  variant = 'default',
  className,
  maxVisibleOptions,
  truncatedHint = 'Введите больше букв для поиска',
  showMoreHint = false,
  onQueryChange,
  'aria-label': ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  disabled?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  clearLabel?: string;
  size?: 'md' | 'sm';
  variant?: 'default' | 'ghost';
  className?: string;
  maxVisibleOptions?: number;
  truncatedHint?: string;
  showMoreHint?: boolean;
  onQueryChange?: (query: string) => void;
  'aria-label'?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const selected = useMemo(
    () => options.find((item) => item.value === value),
    [options, value],
  );
  const filtered = useMemo(() => filterComboboxOptions(options, query), [options, query]);
  const visible = useMemo(() => {
    if (!maxVisibleOptions || query.trim()) return filtered;
    return filtered.slice(0, maxVisibleOptions);
  }, [filtered, maxVisibleOptions, query]);
  const truncated =
    Boolean(maxVisibleOptions) &&
    !query.trim() &&
    (filtered.length > (maxVisibleOptions ?? 0) || showMoreHint);

  function updateQuery(next: string) {
    setQuery(next);
    onQueryChange?.(next);
  }

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  function commit(next: string) {
    onChange(next);
    setOpen(false);
    updateQuery('');
  }

  function moveActive(delta: number) {
    const extra = allowEmpty ? 1 : 0;
    const total = visible.length + extra;
    if (total === 0) return;
    setActive((current) => (current + delta + total) % total);
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={ariaLabel}
          autoComplete="off"
          disabled={disabled}
          className={cn(
            selectClassName,
            'bg-none pr-10',
            size === 'sm' && 'h-8 rounded-lg px-2 pr-7 text-sm',
            variant === 'ghost' &&
              'border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
          )}
          placeholder={placeholder}
          value={open ? query : (selected?.label ?? value)}
          onFocus={() => {
            if (disabled) return;
            setOpen(true);
            updateQuery('');
          }}
          onChange={(event) => {
            updateQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              moveActive(1);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setOpen(true);
              moveActive(-1);
            } else if (event.key === 'Enter' && open) {
              event.preventDefault();
              if (allowEmpty && active === 0) {
                commit('');
                return;
              }
              const item = visible[allowEmpty ? active - 1 : active];
              if (item) commit(item.value);
            } else if (event.key === 'Escape') {
              setOpen(false);
              updateQuery('');
            }
          }}
        />
        <ChevronsUpDown
          className={cn(
            'text-muted pointer-events-none absolute top-1/2 -translate-y-1/2',
            size === 'sm' ? 'right-1.5 h-3.5 w-3.5' : 'right-3 h-4 w-4',
          )}
        />
      </div>
      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          className="border-border bg-card absolute z-50 mt-1 max-h-64 min-w-full w-max overflow-auto rounded-xl border py-1 shadow-md"
        >
          {allowEmpty ? (
            <li>
              <button
                type="button"
                className={cn(
                  'hover:bg-surface-secondary w-full px-3 py-2 text-left text-sm',
                  active === 0 && 'bg-surface-secondary',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit('')}
              >
                {clearLabel}
              </button>
            </li>
          ) : null}
          {visible.length === 0 ? (
            <li className="text-muted px-3 py-2 text-sm">{emptyLabel}</li>
          ) : (
            visible.map((item, index) => {
              const optionIndex = allowEmpty ? index + 1 : index;
              return (
                <li key={item.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={item.value === value}
                    className={cn(
                      'hover:bg-surface-secondary w-full px-3 py-2 text-left text-sm',
                      item.value === value && 'text-primary font-medium',
                      active === optionIndex && 'bg-surface-secondary',
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => commit(item.value)}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })
          )}
          {truncated ? (
            <li className="text-muted border-border border-t px-3 py-2 text-xs">{truncatedHint}</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
