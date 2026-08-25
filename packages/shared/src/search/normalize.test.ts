import { normalizeSearchQuery, searchQueryKey } from './normalize.js';

describe('normalizeSearchQuery', () => {
  it('trims and rejects too short queries', () => {
    expect(normalizeSearchQuery('  iphone 13  ')).toBe('iphone 13');
    expect(normalizeSearchQuery('a')).toBeNull();
    expect(normalizeSearchQuery('')).toBeNull();
  });
});

describe('searchQueryKey', () => {
  it('dedupes case-insensitively', () => {
    expect(searchQueryKey('iPhone 13')).toBe(searchQueryKey('iphone 13'));
  });
});
