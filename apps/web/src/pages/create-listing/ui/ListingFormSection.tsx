import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export function ListingFormSection({
  step,
  title,
  hint,
  children,
  className,
  hasError,
  sectionId,
}: {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  hasError?: boolean;
  sectionId?: string;
}) {
  return (
    <section
      id={sectionId}
      className={cn(
        'border-border bg-card rounded-[var(--radius-card)] border shadow-sm',
        hasError && 'border-red-400 ring-1 ring-red-400/40',
        className,
      )}
    >
      <div className="border-border flex gap-4 border-b px-5 py-4">
        <div
          aria-hidden
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
            hasError ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary',
          )}
        >
          {step}
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {hint ? <p className="text-muted text-sm">{hint}</p> : null}
          {hasError ? (
            <p className="text-danger text-sm" role="alert">
              Есть ошибки в этом блоке
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}
