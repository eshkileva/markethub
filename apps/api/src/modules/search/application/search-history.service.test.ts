import { describe, expect, it, vi } from 'vitest';
import { SearchHistoryService } from './search-history.service.js';

describe('SearchHistoryService', () => {
  it('records query and dedupes by normalized key', async () => {
    const repo = {
      list: vi.fn(),
      findByQueryKey: vi.fn(async () => [{ id: 'old-id' }]),
      insert: vi.fn(async (_userId: string, query: string) => ({
        id: 'new-id',
        query,
        createdAt: new Date('2026-08-25T10:00:00Z'),
      })),
      deleteByIds: vi.fn(async () => [{ id: 'old-id' }]),
      clear: vi.fn(),
      trimToLimit: vi.fn(async () => undefined),
    };
    const service = new SearchHistoryService(repo as never);
    const result = await service.record('user-1', '  iphone   13 ');
    expect(result.item.query).toBe('iphone 13');
    expect(repo.findByQueryKey).toHaveBeenCalledWith('user-1', 'iphone 13');
    expect(repo.deleteByIds).toHaveBeenCalledWith('user-1', ['old-id']);
    expect(repo.trimToLimit).toHaveBeenCalledWith('user-1', 10);
  });

  it('rejects too short query', async () => {
    const service = new SearchHistoryService({} as never);
    await expect(service.record('user-1', 'a')).rejects.toMatchObject({
      message: 'Введите запрос от 2 символов',
    });
  });
});
