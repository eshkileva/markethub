import { Sparkles } from 'lucide-react';
import {
  AI_FEATURE_PITCHES,
  AI_PAGE_PITCHES,
  type AiPageId,
} from '@/features/ai/model/ai-messaging';
import { AiPlatformBadge } from '@/features/ai/ui/AiPlatformBadge';
import { useAiStatus } from '@/features/ai/model/use-ai-status';
import { cn } from '@/shared/lib/cn';

export function AiPagePitch({
  page,
  className,
  compact,
}: {
  page: AiPageId;
  className?: string;
  compact?: boolean;
}) {
  const pitch = AI_PAGE_PITCHES[page];
  const aiStatus = useAiStatus();

  return (
    <section
      className={cn(
        'border-primary/20 from-primary/10 relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent',
        compact ? 'p-4' : 'p-5 md:p-6',
        className,
      )}
    >
      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <AiPlatformBadge live={aiStatus.data?.enabled} size={compact ? 'sm' : 'default'} />
          <h2
            className={cn(
              'font-display font-semibold tracking-tight',
              compact ? 'text-base' : 'text-lg md:text-xl',
            )}
          >
            {pitch.headline}
          </h2>
          <p className={cn('text-muted max-w-2xl', compact ? 'text-xs' : 'text-sm')}>
            {pitch.subline}
          </p>
        </div>
        <Sparkles
          className={cn('text-primary/30 shrink-0', compact ? 'h-8 w-8' : 'h-10 w-10')}
          aria-hidden
        />
      </div>
    </section>
  );
}

export function AiFeaturesShowcase({ className }: { className?: string }) {
  const aiStatus = useAiStatus();

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-primary text-xs font-semibold uppercase tracking-wider">
            AI встроен в платформу
          </p>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Покупка и продажа — с умным помощником
          </h2>
        </div>
        <AiPlatformBadge live={aiStatus.data?.enabled} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AI_FEATURE_PITCHES.map((feature) => (
          <article
            key={feature.title}
            className="border-border bg-card rounded-2xl border p-4 shadow-sm"
          >
            <h3 className="text-sm font-semibold">{feature.title}</h3>
            <p className="text-muted mt-1.5 text-sm leading-relaxed">{feature.description}</p>
            <p className="text-primary mt-2 text-[11px] font-medium uppercase tracking-wide">
              {feature.forRole === 'buyer'
                ? 'Для покупателей'
                : feature.forRole === 'seller'
                  ? 'Для продавцов'
                  : 'Для всех'}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
