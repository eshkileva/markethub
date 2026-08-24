import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { ReportStatus } from '@markethub/shared';
import type { Database } from '../../../infrastructure/database/client.js';
import { listings, reports, users } from '../../../infrastructure/database/schema/index.js';

const reporter = alias(users, 'reporter');
const reportedUser = alias(users, 'reported_user');

export class ReportsRepository {
  constructor(private readonly db: Database) {}

  findListing(listingId: string) {
    return this.db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });
  }

  findUser(userId: string) {
    return this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });
  }

  findById(id: string) {
    return this.db.query.reports.findFirst({
      where: eq(reports.id, id),
    });
  }

  async findOpenDuplicate(reporterId: string, listingId?: string, userId?: string) {
    if (listingId) {
      const [row] = await this.db
        .select({ id: reports.id })
        .from(reports)
        .where(
          and(
            eq(reports.reporterId, reporterId),
            eq(reports.listingId, listingId),
            eq(reports.status, 'open'),
          ),
        )
        .limit(1);
      return row ?? null;
    }
    if (userId) {
      const [row] = await this.db
        .select({ id: reports.id })
        .from(reports)
        .where(
          and(
            eq(reports.reporterId, reporterId),
            eq(reports.userId, userId),
            isNull(reports.listingId),
            eq(reports.status, 'open'),
          ),
        )
        .limit(1);
      return row ?? null;
    }
    return null;
  }

  create(input: {
    reporterId: string;
    listingId: string | null;
    userId: string | null;
    reason: string;
    details: string | null;
  }) {
    return this.db
      .insert(reports)
      .values(input)
      .returning()
      .then((rows) => rows[0]!);
  }

  async countByStatus(status: ReportStatus) {
    const [row] = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(reports)
      .where(eq(reports.status, status));
    return Number(row?.count ?? 0);
  }

  listByStatus(status: ReportStatus, limit: number, offset: number) {
    return this.db
      .select({
        report: reports,
        reporterUsername: reporter.username,
        reportedUsername: reportedUser.username,
        listingTitle: listings.title,
        listingStatus: listings.status,
      })
      .from(reports)
      .innerJoin(reporter, eq(reporter.id, reports.reporterId))
      .leftJoin(reportedUser, eq(reportedUser.id, reports.userId))
      .leftJoin(listings, eq(listings.id, reports.listingId))
      .where(eq(reports.status, status))
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async resolve(id: string, action: 'dismiss' | 'hide_listing', listingId: string | null) {
    return this.db.transaction(async (tx) => {
      if (action === 'hide_listing') {
        if (!listingId) {
          throw new Error('listingId required');
        }
        await tx
          .update(listings)
          .set({ status: 'rejected', updatedAt: new Date() })
          .where(eq(listings.id, listingId));
      }
      const status: ReportStatus = action === 'hide_listing' ? 'resolved' : 'dismissed';
      const [row] = await tx.update(reports).set({ status }).where(eq(reports.id, id)).returning();
      return row ?? null;
    });
  }
}
