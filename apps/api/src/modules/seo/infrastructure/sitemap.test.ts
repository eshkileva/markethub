import { describe, expect, it } from 'vitest';
import { buildSitemapXml, catalogCategoryUrl } from '@markethub/shared';

describe('sitemap url assembly', () => {
  it('does not include empty category slugs', () => {
    const liveSlugs = new Set(['electronics', 'phones']);
    const allSlugs = ['electronics', 'phones', 'auto'];
    const included = allSlugs.filter((slug) => liveSlugs.has(slug));
    const xml = buildSitemapXml(
      included.map((slug) => ({ loc: catalogCategoryUrl('https://kupilko.store', slug) })),
    );
    expect(xml).toContain('category=electronics');
    expect(xml).toContain('category=phones');
    expect(xml).not.toContain('category=auto');
  });
});
