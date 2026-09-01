import { Link } from '@tanstack/react-router';
import { useAuthStore } from '@/shared/model/stores';
import { cn } from '@/shared/lib/cn';

export function AuthGuestBanner({ className }: { className?: string }) {
  const token = useAuthStore((s) => s.accessToken);
  if (token) return null;

  return (
    <div
      className={cn(
        'border-primary/20 bg-primary/5 rounded-2xl border px-4 py-3 text-sm leading-relaxed',
        className,
      )}
    >
      <span className="text-foreground font-medium">Смотрите объявления без регистрации.</span>{' '}
      <Link to="/auth" className="text-primary font-semibold hover:underline">
        Войдите
      </Link>{' '}
      или{' '}
      <Link to="/auth" className="text-primary font-semibold hover:underline">
        зарегистрируйтесь
      </Link>
      , чтобы писать продавцам, сохранять в избранное и размещать объявления.
    </div>
  );
}

export function AuthRequiredHint({ action, className }: { action: string; className?: string }) {
  const token = useAuthStore((s) => s.accessToken);
  if (token) return null;

  return (
    <p className={cn('text-muted text-xs leading-relaxed', className)}>
      <Link to="/auth" className="text-primary font-medium hover:underline">
        Войдите
      </Link>
      , чтобы {action}.
    </p>
  );
}
