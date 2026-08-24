import { z } from 'zod';
import type { NotificationType } from '@markethub/shared';
import { NotFoundError } from '../../../shared/errors/app-error.js';
import type { NotificationsRepository } from '../infrastructure/notifications.repository.js';

const messageSentSchema = z.object({
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  messageId: z.string().uuid(),
});

const reviewCreatedSchema = z.object({
  reviewId: z.string().uuid(),
  authorId: z.string().uuid(),
  subjectId: z.string().uuid(),
  listingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
});

const reportResolvedSchema = z.object({
  reportId: z.string().uuid(),
  reporterId: z.string().uuid(),
  listingId: z.string().uuid().nullable(),
  listingTitle: z.string().nullable(),
  sellerId: z.string().uuid().nullable(),
  action: z.enum(['dismiss', 'hide_listing']),
});

const listingSoldSchema = z.object({
  listingId: z.string().uuid(),
  sellerId: z.string().uuid(),
});

function parsePayload(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function serializeNotification(row: {
  id: string;
  type: string;
  payload: string | null;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    type: row.type as NotificationType,
    payload: parsePayload(row.payload),
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function previewText(body: string) {
  const trimmed = body.trim();
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed;
}

export class NotificationsService {
  constructor(private readonly repo: NotificationsRepository) {}

  async list(userId: string, page: number, pageSize: number) {
    const [total, unreadCount, rows] = await Promise.all([
      this.repo.countForUser(userId),
      this.repo.countUnread(userId),
      this.repo.listForUser(userId, pageSize, (page - 1) * pageSize),
    ]);
    return {
      page,
      pageSize,
      total,
      unreadCount,
      items: rows.map(serializeNotification),
    };
  }

  unreadCount(userId: string) {
    return this.repo.countUnread(userId).then((count) => ({ count }));
  }

  async markRead(userId: string, id: string) {
    const existing = await this.repo.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Notification not found');
    }
    if (existing.readAt) {
      return serializeNotification(existing);
    }
    const updated = await this.repo.markRead(id, userId);
    return serializeNotification(updated ?? existing);
  }

  async markAllRead(userId: string) {
    const updated = await this.repo.markAllRead(userId);
    return { updated };
  }

  async handleMessageSent(payload: unknown) {
    const parsed = messageSentSchema.safeParse(payload);
    if (!parsed.success) return;
    const { conversationId, senderId, messageId } = parsed.data;

    const [participants, sender, message, conversation] = await Promise.all([
      this.repo.listParticipantUserIds(conversationId),
      this.repo.findUser(senderId),
      this.repo.findMessage(messageId),
      this.repo.findConversation(conversationId),
    ]);
    if (!sender || !message) return;

    const listing = conversation ? await this.repo.findListing(conversation.listingId) : null;
    const recipients = participants.map((row) => row.userId).filter((id) => id !== senderId);
    if (recipients.length === 0) return;

    await this.repo.createMany(
      recipients.map((userId) => ({
        userId,
        type: 'message' as const,
        payload: JSON.stringify({
          conversationId,
          listingId: listing?.id ?? conversation?.listingId ?? null,
          listingTitle: listing?.title ?? null,
          fromUsername: sender.username,
          preview: previewText(message.body),
        }),
      })),
    );
  }

  async handleReviewCreated(payload: unknown) {
    const parsed = reviewCreatedSchema.safeParse(payload);
    if (!parsed.success) return;
    const { authorId, subjectId, listingId, rating } = parsed.data;
    if (authorId === subjectId) return;

    const [author, listing] = await Promise.all([
      this.repo.findUser(authorId),
      this.repo.findListing(listingId),
    ]);
    await this.repo.create({
      userId: subjectId,
      type: 'review',
      payload: JSON.stringify({
        listingId,
        listingTitle: listing?.title ?? null,
        authorUsername: author?.username ?? null,
        rating,
      }),
    });
  }

  async handleReportResolved(payload: unknown) {
    const parsed = reportResolvedSchema.safeParse(payload);
    if (!parsed.success) return;
    const { reporterId, listingId, listingTitle, sellerId, action } = parsed.data;

    await this.repo.create({
      userId: reporterId,
      type: 'report_update',
      payload: JSON.stringify({
        listingId,
        listingTitle,
        action: action === 'hide_listing' ? 'resolved' : 'dismissed',
      }),
    });

    if (action === 'hide_listing' && sellerId && sellerId !== reporterId) {
      await this.repo.create({
        userId: sellerId,
        type: 'listing_hidden',
        payload: JSON.stringify({ listingId, listingTitle }),
      });
    }
  }

  async handleListingSold(payload: unknown) {
    const parsed = listingSoldSchema.safeParse(payload);
    if (!parsed.success) return;
    const { listingId, sellerId } = parsed.data;
    const [listing, buyers] = await Promise.all([
      this.repo.findListing(listingId),
      this.repo.listBuyerUserIdsForListing(listingId, sellerId),
    ]);
    if (buyers.length === 0) return;
    await this.repo.createMany(
      buyers.map((row) => ({
        userId: row.userId,
        type: 'listing_sold' as const,
        payload: JSON.stringify({
          listingId,
          listingTitle: listing?.title ?? null,
        }),
      })),
    );
  }
}
