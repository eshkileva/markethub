import { describe, expect, it } from 'vitest';
import { listingCategoryIds } from './category-tree.js';

describe('listingCategoryIds', () => {
  const rows = [
    { id: 'phones', parentId: null },
    { id: 'smartphones', parentId: 'phones' },
    { id: 'tablets', parentId: 'phones' },
    { id: 'laptops', parentId: 'computers' },
  ];

  it('includes a root and its leaves so catalog can filter a parent', () => {
    expect(listingCategoryIds(rows, 'phones').sort()).toEqual(
      ['phones', 'smartphones', 'tablets'].sort(),
    );
  });

  it('returns only the leaf when the category has no children', () => {
    expect(listingCategoryIds(rows, 'smartphones')).toEqual(['smartphones']);
  });
});
