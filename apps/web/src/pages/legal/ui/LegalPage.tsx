import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { CONTACT_EMAIL, SITE_NAME } from '@markethub/shared';
import { SeoHead, siteOrigin } from '@/shared/lib/seo-head';

export function LegalPage({
  title,
  description,
  path,
  children,
}: {
  title: string;
  description: string;
  path: '/privacy' | '/terms';
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <SeoHead
        title={`${title} — ${SITE_NAME}`}
        description={description}
        canonical={`${siteOrigin()}${path}`}
      />
      <div>
        <p className="text-muted text-sm">
          <Link to="/" className="text-primary hover:underline">
            На главную
          </Link>
        </p>
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted mt-1 text-sm">
          Сервис {SITE_NAME} (kupilko.store). Контакт: {CONTACT_EMAIL}
        </p>
      </div>
      <div className="text-foreground space-y-4 text-sm leading-relaxed">{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
