import { z } from 'zod';

const empty = (value: unknown) => (value === '' || value === null ? undefined : value);

export const catalogSearchSchema = z.object({
  q: z.preprocess(empty, z.string().optional()),
  category: z.preprocess(empty, z.string().optional()),
  country: z.preprocess(empty, z.enum(['BY', 'RU', 'KZ']).optional()),
  city: z.preprocess(empty, z.string().optional()),
  minPrice: z.preprocess(empty, z.coerce.number().nonnegative().optional()),
  maxPrice: z.preprocess(empty, z.coerce.number().nonnegative().optional()),
  currency: z.preprocess(empty, z.enum(['BYN', 'RUB', 'KZT']).optional()),
  condition: z.preprocess(empty, z.enum(['new', 'used', 'for_parts']).optional()),
  delivery: z.preprocess(empty, z.enum(['meetup', 'courier', 'post', 'pickup']).optional()),
  sort: z.preprocess(empty, z.enum(['newest', 'price_asc', 'price_desc']).optional()),
  page: z.preprocess(empty, z.coerce.number().int().min(1).optional()),
  view: z.preprocess(empty, z.enum(['grid', 'list']).optional()),
});

export type CatalogSearch = z.infer<typeof catalogSearchSchema>;
