import { Link } from '@tanstack/react-router';
import { CONTACT_EMAIL, SITE_NAME } from '@markethub/shared';
import { cn } from '@/shared/lib/cn';

export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer
      className={cn(
        'border-border text-muted mt-10 border-t px-1 py-6 text-sm leading-relaxed',
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-foreground font-medium">{SITE_NAME}</p>
          <p>Объявления в Беларуси, России и Казахстане.</p>
          <p>
            По всем вопросам:{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary font-medium hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
        <nav className="flex flex-col gap-1 sm:items-end">
          <Link to="/privacy" className="text-primary hover:underline">
            Политика конфиденциальности
          </Link>
          <Link to="/terms" className="text-primary hover:underline">
            Пользовательское соглашение
          </Link>
        </nav>
      </div>
      <p className="mt-4 text-xs">
        © {year} {SITE_NAME}
      </p>
    </footer>
  );
}
