import type { EventBus } from '../../../shared/events/event-bus.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/app-error.js';
import type { ReportsRepository } from '../infrastructure/reports.repository.js';
import type { ReportStatus } from '@markethub/shared';

function serializeReport(row: {
  id: string;
  reporterId: string;
  listingId: string | null;
  userId: string | null;
  reason: string;
  details: string | null;
  status: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    reporterId: row.reporterId,
    listingId: row.listingId,
    userId: row.userId,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export class ReportsService {
  constructor(
    private readonly repo: ReportsRepository,
    private readonly events: EventBus,
  ) {}

  async create(
    reporterId: string,
    input: { listingId?: string; userId?: string; reason: string; details?: string },
  ) {
    if (!input.listingId && !input.userId) {
      throw new ValidationError('listingId or userId is required');
    }

    let listingId = input.listingId ?? null;
    let userId = input.userId ?? null;

    if (listingId) {
      const listing = await this.repo.findListing(listingId);
      if (!listing) {
        throw new NotFoundError('Listing not found');
      }
      if (listing.sellerId === reporterId) {
        throw new ForbiddenError('You cannot report your own listing');
      }
      userId = userId ?? listing.sellerId;
    }

    if (userId) {
      if (userId === reporterId) {
        throw new ForbiddenError('You cannot report yourself');
      }
      const subject = await this.repo.findUser(userId);
      if (!subject) {
        throw new NotFoundError('User not found');
      }
    }

    const duplicate = await this.repo.findOpenDuplicate(
      reporterId,
      listingId ?? undefined,
      listingId ? undefined : (userId ?? undefined),
    );
    if (duplicate) {
      throw new ConflictError('You already have an open report');
    }

    const row = await this.repo.create({
      reporterId,
      listingId,
      userId,
      reason: input.reason,
      details: input.details?.trim() ? input.details.trim() : null,
    });
    await this.events.publish('ReportCreated', {
      reportId: row.id,
      reporterId,
      listingId,
      userId,
      reason: input.reason,
    });
    return serializeReport(row);
  }

  async list(status: ReportStatus, page: number, pageSize: number) {
    const total = await this.repo.countByStatus(status);
    const rows = await this.repo.listByStatus(status, pageSize, (page - 1) * pageSize);
    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => ({
        ...serializeReport(row.report),
        reporterUsername: row.reporterUsername,
        reportedUsername: row.reportedUsername,
        listingTitle: row.listingTitle,
        listingStatus: row.listingStatus,
      })),
    };
  }

  async resolve(id: string, action: 'dismiss' | 'hide_listing') {
    const report = await this.repo.findById(id);
    if (!report) {
      throw new NotFoundError('Report not found');
    }
    if (report.status !== 'open') {
      throw new ValidationError('Report is already closed');
    }

    if (action === 'hide_listing' && !report.listingId) {
      throw new ValidationError('This report has no listing to hide');
    }

    const updated = await this.repo.resolve(id, action, report.listingId);
    const listing = report.listingId ? await this.repo.findListing(report.listingId) : null;
    await this.events.publish('ReportResolved', {
      reportId: id,
      reporterId: report.reporterId,
      listingId: report.listingId,
      listingTitle: listing?.title ?? null,
      sellerId: listing?.sellerId ?? report.userId,
      action,
    });
    return serializeReport(updated!);
  }
}
