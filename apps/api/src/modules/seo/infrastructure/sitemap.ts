import { eq } from 'drizzle-orm';
import {
  buildSitemapXml,
  catalogCategoryUrl,
  listingUrl,
  type SitemapUrl,
} from '@markethub/shared';
import type { Database } from '../../../infrastructure/database/client.js';
import { categories, listings } from '../../../infrastructure/database/schema/index.js';

export async function buildLiveSitemap(db: Database, siteOrigin: string): Promise<string> {
  const origin = siteOrigin.replace(/\/$/, '');
  const published = await db
    .select({
      id: listings.id,
      updatedAt: listings.updatedAt,
      categoryId: listings.categoryId,
    })
    .from(listings)
    .where(eq(listings.status, 'published'));

  const urls: SitemapUrl[] = [{ loc: `${origin}/` }, { loc: `${origin}/catalog` }];

  if (published.length === 0) {
    return buildSitemapXml(urls);
  }

  const categoryRows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      parentId: categories.parentId,
    })
    .from(categories);

  const byId = new Map(categoryRows.map((row) => [row.id, row]));
  const slugs = new Set<string>();
  const latestByCategory = new Map<string, Date>();

  for (const row of published) {
    let current = byId.get(row.categoryId);
    while (current) {
      slugs.add(current.slug);
      const prev = latestByCategory.get(current.slug);
      if (!prev || row.updatedAt > prev) latestByCategory.set(current.slug, row.updatedAt);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  }

  for (const slug of [...slugs].sort()) {
    urls.push({
      loc: catalogCategoryUrl(origin, slug),
      lastmod: latestByCategory.get(slug)?.toISOString(),
    });
  }

  for (const row of published) {
    urls.push({
      loc: listingUrl(origin, row.id),
      lastmod: row.updatedAt.toISOString(),
    });
  }

  return buildSitemapXml(urls);
}
