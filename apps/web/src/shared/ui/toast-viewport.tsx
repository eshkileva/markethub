import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useToastStore, type ToastVariant } from '@/shared/model/toast-store';
import { Button } from '@/shared/ui/button';

const variantClass: Record<ToastVariant, string> = {
  error:
    'border-red-200 bg-red-50 text-red-950 dark:border-red-900/40 dark:bg-red-950/90 dark:text-red-100',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/90 dark:text-emerald-100',
  info: 'border-border bg-card text-foreground',
};

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col gap-2 px-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:max-w-sm sm:px-0"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="alert"
          className={cn(
            'pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-md',
            variantClass[item.variant],
          )}
        >
          <p className="min-w-0 flex-1 leading-snug">{item.message}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-mr-1 h-7 w-7 shrink-0 text-inherit hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Закрыть"
            onClick={() => dismiss(item.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
