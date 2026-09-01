import { Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { AI_PLATFORM_NAME } from '@/features/ai/model/ai-messaging';

export function AiPlatformBadge({
  className,
  live,
  size = 'default',
}: {
  className?: string;
  live?: boolean;
  size?: 'default' | 'sm';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        live
          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100'
          : 'bg-primary/15 text-primary',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        className,
      )}
    >
      <Sparkles className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      {AI_PLATFORM_NAME}
    </span>
  );
}
