import * as React from 'react';
import { cn } from '@/shared/lib/cn';

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      {...props}
    />
  );
}
