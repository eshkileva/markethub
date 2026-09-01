import { describe, expect, it, vi } from 'vitest';
import { ModerationService } from './moderation.service.js';

describe('ModerationService', () => {
  it('approves queued listing and publishes event', async () => {
    const listing = {
      id: 'listing-1',
      sellerId: 'seller-1',
      country: 'RU',
      status: 'published',
    };
    const repo = {
      approve: vi.fn(async () => listing),
      reject: vi.fn(),
      findById: vi.fn(),
      listQueue: vi.fn(),
    };
    const events = { publish: vi.fn(async () => undefined) };
    const service = new ModerationService(repo as never, events as never);

    await service.approve('listing-1');

    expect(repo.approve).toHaveBeenCalledWith('listing-1');
    expect(events.publish).toHaveBeenCalledWith('ListingPublished', {
      listingId: 'listing-1',
      sellerId: 'seller-1',
      country: 'RU',
    });
  });
});
