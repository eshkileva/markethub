import { describe, expect, it, vi } from 'vitest';
import { ConflictError, ValidationError } from '../../../shared/errors/app-error.js';
import { ListingsService } from './listings.service.js';

function geo() {
  return { assertCity: vi.fn(async () => undefined) };
}

function events() {
  return { publish: vi.fn(async () => undefined), subscribe: vi.fn() };
}

function listingCopilot() {
  return { assessForPublish: vi.fn(async () => null) };
}

describe('ListingsService status transitions', () => {
  it('reserves a published listing', async () => {
    const repo = {
      findById: vi.fn(async () => ({
        id: 'listing-1',
        sellerId: 'seller-1',
        status: 'published',
      })),
      setStatusIf: vi.fn(async () => ({
        id: 'listing-1',
        sellerId: 'seller-1',
        status: 'reserved',
      })),
    };
    const service = new ListingsService(
      repo as never,
      events() as never,
      geo() as never,
      listingCopilot() as never,
    );
    const listing = await service.reserve('seller-1', 'listing-1');
    expect(listing.status).toBe('reserved');
    expect(repo.setStatusIf).toHaveBeenCalledWith('listing-1', ['published'], 'reserved');
  });

  it('returns 409 when reserving a draft', async () => {
    const repo = {
      findById: vi.fn(async () => ({
        id: 'listing-1',
        sellerId: 'seller-1',
        status: 'draft',
      })),
      setStatusIf: vi.fn(async () => null),
    };
    const service = new ListingsService(
      repo as never,
      events() as never,
      geo() as never,
      listingCopilot() as never,
    );
    await expect(service.reserve('seller-1', 'listing-1')).rejects.toBeInstanceOf(ConflictError);
    expect(repo.setStatusIf).toHaveBeenCalledWith('listing-1', ['published'], 'reserved');
  });
});

describe('ListingsService createDraft category leaf', () => {
  const input = {
    title: 'iPhone 13',
    description: 'Телефон без сколов, батарея держит день',
    categoryId: 'phones-root',
    price: 100,
    currency: 'BYN' as const,
    country: 'BY' as const,
    city: 'Минск',
    condition: 'used' as const,
    deliveryModes: ['meetup' as const],
    attributes: [],
  };

  it('rejects a root category', async () => {
    const repo = {
      isLeafCategory: vi.fn(async () => false),
      create: vi.fn(),
    };
    const service = new ListingsService(
      repo as never,
      events() as never,
      geo() as never,
      listingCopilot() as never,
    );
    await expect(service.createDraft('seller-1', input)).rejects.toBeInstanceOf(ValidationError);
    await expect(service.createDraft('seller-1', input)).rejects.toThrow('Выберите подкатегорию');
    expect(repo.create).not.toHaveBeenCalled();
  });
});
