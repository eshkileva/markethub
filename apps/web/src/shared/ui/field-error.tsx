import { cn } from '@/shared/lib/cn';

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-danger text-xs" role="alert">
      {message}
    </p>
  );
}

export function fieldControlClass(hasError: boolean, className?: string) {
  return cn(
    className,
    hasError && 'border-red-500 focus-visible:ring-red-500/30 aria-invalid:border-red-500',
  );
}
