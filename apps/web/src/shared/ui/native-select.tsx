import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export const selectClassName =
  'border-border bg-card text-foreground flex h-10 w-full appearance-none rounded-xl border bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat px-3 pr-9 text-sm shadow-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50';

export function NativeSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(selectClassName, className)} {...props} />;
}
