import { MAX_SEARCH_QUERY_LENGTH, MIN_SEARCH_QUERY_LENGTH } from '../limits.js';

export function normalizeSearchQuery(raw: string): string | null {
  const query = raw.trim().replace(/\s+/g, ' ');
  if (query.length < MIN_SEARCH_QUERY_LENGTH || query.length > MAX_SEARCH_QUERY_LENGTH) {
    return null;
  }
  return query;
}

export function searchQueryKey(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU');
}
