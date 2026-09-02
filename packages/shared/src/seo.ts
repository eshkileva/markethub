export const SITE_NAME = 'Купилко';
export const CONTACT_EMAIL = 'eshkileva69@gmail.com';
export const DEFAULT_TITLE = 'Купилко — объявления в СНГ';
export const DEFAULT_DESCRIPTION =
  'Доска объявлений для Беларуси, России и Казахстана. Покупайте и продавайте с умным поиском и Trust Score.';

/** Paths that must not be indexed. Keep in sync with robots.txt. */
export const ROBOTS_DISALLOW_PATHS = [
  '/auth',
  '/forgot-password',
  '/verify-email',
  '/messages',
  '/settings',
  '/moderation',
  '/listings/create',
  '/favorites',
  '/my-listings',
  '/purchases',
  '/sales',
  '/notifications',
] as const;

export function normalizeSiteOrigin(origin: string): string {
  return origin.split(',')[0]?.trim().replace(/\/$/, '') || origin;
}

export function buildRobotsTxt(siteOrigin: string): string {
  const origin = normalizeSiteOrigin(siteOrigin);
  return [
    'User-agent: *',
    'Allow: /',
    ...ROBOTS_DISALLOW_PATHS.map((path) => `Disallow: ${path}`),
    'Disallow: /*/edit',
    '',
    'Clean-param: sort&view&q&page&minPrice&maxPrice&currency&condition&delivery&attr&country&city',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export type SitemapUrl = {
  loc: string;
  lastmod?: string;
};

export function buildSitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map((url) => {
      const lastmod = url.lastmod ? `\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(url.loc)}</loc>${lastmod}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function catalogCategoryUrl(siteOrigin: string, slug: string): string {
  const origin = normalizeSiteOrigin(siteOrigin);
  return `${origin}/catalog?category=${encodeURIComponent(slug)}`;
}

export function listingUrl(siteOrigin: string, id: string): string {
  return `${normalizeSiteOrigin(siteOrigin)}/listings/${id}`;
}

export function isRobotsDisallowPath(pathname: string): boolean {
  if (pathname.endsWith('/edit')) return true;
  return (ROBOTS_DISALLOW_PATHS as readonly string[]).includes(pathname);
}
