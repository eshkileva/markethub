import * as React from 'react';
import { cn } from '@/shared/lib/cn';

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'border-border bg-card text-foreground placeholder:text-muted focus-visible:ring-primary/30 flex h-10 w-full min-w-0 rounded-xl border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
