import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useUiStore, type ThemeMode } from '@/shared/model/stores';

const OPTIONS: Array<{ id: ThemeMode; label: string; Icon: typeof Sun }> = [
  { id: 'system', label: 'Система', Icon: Monitor },
  { id: 'light', label: 'Светлая', Icon: Sun },
  { id: 'dark', label: 'Тёмная', Icon: Moon },
];

export function ThemeSwitch() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  return (
    <div
      className="border-border bg-background flex shrink-0 items-center rounded-2xl border p-0.5"
      role="group"
      aria-label="Тема оформления"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-label={option.label}
            aria-pressed={active}
            onClick={() => setTheme(option.id)}
            className={cn(
              'flex h-8 items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium transition-colors duration-200',
              active ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground',
            )}
          >
            <option.Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
