/** React Query defaults for owned dictionaries (cities, catalogs). */
export const staticDictionaryQueryOptions = {
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: 1000 * 60 * 60 * 24,
} as const;
