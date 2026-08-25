import { describe, expect, it } from 'vitest';
import { SEED_LEAVES, SEED_ROOTS, leafSlugForRoot } from './category-tree.seed.js';

describe('category tree seed data', () => {
  it('has 13 roots including jobs', () => {
    expect(SEED_ROOTS).toHaveLength(13);
    expect(SEED_ROOTS.some((root) => root.slug === 'jobs')).toBe(true);
  });

  it('has jobs leaves', () => {
    expect(SEED_LEAVES.some((leaf) => leaf.slug === 'vacancies')).toBe(true);
    expect(SEED_LEAVES.some((leaf) => leaf.slug === 'resumes')).toBe(true);
  });

  it('uses unique slugs across roots and leaves', () => {
    const slugs = [...SEED_ROOTS.map((item) => item.slug), ...SEED_LEAVES.map((item) => item.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('points every leaf at an existing root', () => {
    const rootSlugs = new Set(SEED_ROOTS.map((item) => item.slug));
    for (const leaf of SEED_LEAVES) {
      expect(rootSlugs.has(leaf.parentSlug)).toBe(true);
    }
  });
});

describe('leafSlugForRoot', () => {
  it('maps electronics kinds to leaves', () => {
    expect(leafSlugForRoot('electronics', 'Наушники')).toBe('audio');
    expect(leafSlugForRoot('electronics', 'Приставка')).toBe('consoles');
    expect(leafSlugForRoot('electronics', 'Монитор')).toBe('tv-video');
  });

  it('maps phones without kind to smartphones', () => {
    expect(leafSlugForRoot('phones')).toBe('smartphones');
  });
});
