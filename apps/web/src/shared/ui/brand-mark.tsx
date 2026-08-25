import { cn } from '@/shared/lib/cn';

export function BrandMark({
  className,
  compact = false,
  tone = 'onDark',
}: {
  className?: string;
  compact?: boolean;
  tone?: 'onDark' | 'onLight';
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className="bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)]"
        aria-hidden
      >
        <span className="font-display -rotate-6 text-lg font-semibold leading-none">К</span>
      </div>
      {compact ? null : (
        <div className="min-w-0">
          <div className="font-display text-[15px] font-semibold tracking-tight">Купилко</div>
          <div
            className={cn(
              'text-[11px] leading-tight',
              tone === 'onDark' ? 'text-sidebar-muted' : 'text-muted',
            )}
          >
            Объявления СНГ
          </div>
        </div>
      )}
    </div>
  );
}
