import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Database } from '../../../infrastructure/database/client.js';
import { searchHistory } from '../../../infrastructure/database/schema/index.js';

export class SearchHistoryRepository {
  constructor(private readonly db: Database) {}

  list(userId: string, limit: number) {
    return this.db
      .select({
        id: searchHistory.id,
        query: searchHistory.query,
        createdAt: searchHistory.createdAt,
      })
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(limit);
  }

  async findByQueryKey(userId: string, queryKey: string) {
    const rows = await this.db
      .select({ id: searchHistory.id })
      .from(searchHistory)
      .where(
        and(
          eq(searchHistory.userId, userId),
          sql`lower(trim(${searchHistory.query})) = ${queryKey}`,
        ),
      );
    return rows;
  }

  async insert(userId: string, query: string) {
    const [row] = await this.db.insert(searchHistory).values({ userId, query }).returning({
      id: searchHistory.id,
      query: searchHistory.query,
      createdAt: searchHistory.createdAt,
    });
    return row ?? null;
  }

  deleteByIds(userId: string, ids: string[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.db
      .delete(searchHistory)
      .where(and(eq(searchHistory.userId, userId), inArray(searchHistory.id, ids)))
      .returning({ id: searchHistory.id });
  }

  clear(userId: string) {
    return this.db.delete(searchHistory).where(eq(searchHistory.userId, userId));
  }

  async trimToLimit(userId: string, limit: number) {
    const rows = await this.db
      .select({ id: searchHistory.id })
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt));
    const excess = rows.slice(limit);
    if (excess.length === 0) return;
    await this.deleteByIds(
      userId,
      excess.map((row) => row.id),
    );
  }
}
