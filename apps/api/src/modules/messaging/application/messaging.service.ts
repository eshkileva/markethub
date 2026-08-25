import type { EventBus } from '../../../shared/events/event-bus.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/app-error.js';
import type { ChatHub } from '../infrastructure/chat-hub.js';
import type { MessagingRepository } from '../infrastructure/messaging.repository.js';

function serializeMessage(message: {
  id: string;
  senderId: string;
  body: string;
  createdAt: Date;
}) {
  return {
    id: message.id,
    senderId: message.senderId,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}

export class MessagingService {
  constructor(
    private readonly repo: MessagingRepository,
    private readonly events: EventBus,
    private readonly hub: ChatHub,
  ) {}

  isParticipantOnListing(listingId: string, userId: string) {
    return this.repo.isParticipantOnListing(listingId, userId);
  }

  async open(userId: string, listingId: string) {
    const listing = await this.repo.findListing(listingId);
    if (!listing) {
      throw new NotFoundError('Listing not found');
    }
    if (listing.sellerId === userId) {
      throw new ValidationError('Cannot message yourself');
    }

    const existing = await this.repo.findBetween(listingId, userId);
    if (existing) {
      const conversation = await this.repo.findConversation(existing.id);
      if (!conversation) throw new NotFoundError('Conversation not found');
      return this.get(userId, conversation.id);
    }
    if (listing.status !== 'published') {
      throw new NotFoundError('Listing not found');
    }

    const conversation = await this.repo.createWithParticipants(
      listingId,
      userId,
      listing.sellerId,
    );
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    return this.get(userId, conversation.id);
  }

  unreadCount(userId: string) {
    return this.repo.countUnread(userId).then((count) => ({ count }));
  }

  async list(userId: string) {
    const items = await this.decorateInbox(userId, await this.repo.listForUser(userId));
    return {
      items: items.map((item) => ({
        id: item.id,
        updatedAt: item.updatedAt,
        unreadCount: item.unreadCount,
        listing: {
          id: item.listing.id,
          title: item.listing.title,
          imageUrl: item.listing.imageUrl,
        },
        peer: item.peer,
        lastMessage: item.lastMessage,
      })),
    };
  }

  async listPurchases(userId: string) {
    const items = await this.decorateInbox(userId, await this.repo.listForBuyer(userId));
    return {
      items: items.map((item) => ({
        conversationId: item.id,
        updatedAt: item.updatedAt,
        unreadCount: item.unreadCount,
        lastMessage: item.lastMessage,
        listing: item.listing,
        seller: item.peer,
      })),
    };
  }

  private async decorateInbox(
    userId: string,
    rows: Array<{
      conversation: { id: string; updatedAt: Date };
      lastReadAt: Date | null;
      listing: {
        id: string;
        title: string;
        price: string;
        currency: string;
        city: string;
        country: string;
        status: string;
      };
    }>,
  ) {
    const conversationIds = rows.map((row) => row.conversation.id);
    const listingIds = rows.map((row) => row.listing.id);
    const [people, images, allMessages] = await Promise.all([
      this.repo.participantsFor(conversationIds),
      this.repo.imagesFor(listingIds),
      this.repo.messagesFor(conversationIds),
    ]);

    const coverByListing = new Map<string, string>();
    for (const image of images) {
      if (!coverByListing.has(image.listingId)) {
        coverByListing.set(image.listingId, image.url);
      }
    }

    const lastByConversation = new Map<string, (typeof allMessages)[number]>();
    const unreadByConversation = new Map<string, number>();
    const lastReadByConversation = new Map(
      rows.map((row) => [row.conversation.id, row.lastReadAt]),
    );

    for (const message of allMessages) {
      if (!lastByConversation.has(message.conversationId)) {
        lastByConversation.set(message.conversationId, message);
      }
      const lastReadAt = lastReadByConversation.get(message.conversationId);
      if (message.senderId !== userId && (!lastReadAt || message.createdAt > lastReadAt)) {
        unreadByConversation.set(
          message.conversationId,
          (unreadByConversation.get(message.conversationId) ?? 0) + 1,
        );
      }
    }

    return rows.map(({ conversation, listing }) => {
      const peer = people.find(
        (person) => person.conversationId === conversation.id && person.userId !== userId,
      );
      const last = lastByConversation.get(conversation.id);
      return {
        id: conversation.id,
        updatedAt: conversation.updatedAt.toISOString(),
        unreadCount: unreadByConversation.get(conversation.id) ?? 0,
        listing: {
          id: listing.id,
          title: listing.title,
          imageUrl: coverByListing.get(listing.id) ?? null,
          status: listing.status,
          price: Number(listing.price),
          currency: listing.currency,
          city: listing.city,
          country: listing.country,
        },
        peer: peer
          ? {
              id: peer.userId,
              username: peer.username,
              displayName: peer.displayName,
              avatarUrl: peer.avatarUrl,
            }
          : null,
        lastMessage: last ? serializeMessage(last) : null,
      };
    });
  }

  async get(userId: string, conversationId: string) {
    const conversation = await this.repo.findConversation(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    if (!(await this.repo.isParticipant(conversationId, userId))) {
      throw new ForbiddenError();
    }

    const [participants, listing, messageRows] = await Promise.all([
      this.repo.participantsFor([conversationId]),
      this.repo.findListing(conversation.listingId),
      this.repo.listMessages(conversationId),
    ]);
    const images = listing ? await this.repo.imagesFor([listing.id]) : [];
    const peer = participants.find((person) => person.userId !== userId);

    await this.repo.markRead(conversationId, userId);

    return {
      id: conversation.id,
      listing: listing
        ? {
            id: listing.id,
            title: listing.title,
            imageUrl: images[0]?.url ?? null,
          }
        : null,
      peer: peer
        ? {
            id: peer.userId,
            username: peer.username,
            displayName: peer.displayName,
            avatarUrl: peer.avatarUrl,
          }
        : null,
      messages: messageRows.map(serializeMessage),
    };
  }

  async send(userId: string, conversationId: string, body: string) {
    if (!(await this.repo.isParticipant(conversationId, userId))) {
      throw new ForbiddenError();
    }
    const message = await this.repo.insertMessage(conversationId, userId, body);
    const participants = await this.repo.listParticipants(conversationId);
    const serialized = serializeMessage(message);
    const participantIds = participants.map((row) => row.userId);

    await this.events.publish('MessageSent', {
      conversationId,
      senderId: userId,
      messageId: message.id,
    });

    this.hub.sendTo(participantIds, {
      type: 'message',
      conversationId,
      message: serialized,
    });

    return serialized;
  }
}
