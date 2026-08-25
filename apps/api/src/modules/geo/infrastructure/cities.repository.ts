import { and, eq, sql } from 'drizzle-orm';
import type { CountryCode } from '@markethub/shared';
import { MAX_GEO_CITIES } from '@markethub/shared/limits';
import type { Database } from '../../../infrastructure/database/client.js';
import { cities } from '../../../infrastructure/database/schema/index.js';

export class CitiesRepository {
  constructor(private readonly db: Database) {}

  list(country: CountryCode, query?: string, limit = MAX_GEO_CITIES) {
    const conditions = [eq(cities.country, country)];
    if (query?.trim()) {
      const needle = `%${query.trim()}%`;
      conditions.push(sql`${cities.nameRu} ilike ${needle}`);
    }
    return this.db
      .select({
        nameRu: cities.nameRu,
        country: cities.country,
      })
      .from(cities)
      .where(and(...conditions))
      .orderBy(cities.nameRu)
      .limit(limit);
  }

  async exists(country: CountryCode, nameRu: string) {
    const needle = nameRu.trim();
    const [row] = await this.db
      .select({ id: cities.id })
      .from(cities)
      .where(
        and(
          eq(cities.country, country),
          sql`lower(${cities.nameRu}) = ${needle.toLocaleLowerCase('ru-RU')}`,
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  async insertIgnore(rows: Array<{ country: CountryCode; nameRu: string }>) {
    if (rows.length === 0) return;
    await this.db
      .insert(cities)
      .values(rows.map((row) => ({ country: row.country, nameRu: row.nameRu })))
      .onConflictDoNothing({ target: [cities.country, cities.nameRu] });
  }

  count() {
    return this.db.select({ count: sql<number>`cast(count(*) as int)` }).from(cities);
  }
}
