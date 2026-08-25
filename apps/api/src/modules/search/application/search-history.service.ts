import { MAX_SEARCH_HISTORY, normalizeSearchQuery, searchQueryKey } from '@markethub/shared';
import { ValidationError } from '../../../shared/errors/app-error.js';
import type { SearchHistoryRepository } from '../infrastructure/search-history.repository.js';

export class SearchHistoryService {
  constructor(private readonly repo: SearchHistoryRepository) {}

  list(userId: string) {
    return this.repo.list(userId, MAX_SEARCH_HISTORY).then((items) => ({ items }));
  }

  async record(userId: string, rawQuery: string) {
    const query = normalizeSearchQuery(rawQuery);
    if (!query) {
      throw new ValidationError('Введите запрос от 2 символов');
    }
    const key = searchQueryKey(query);
    const duplicates = await this.repo.findByQueryKey(userId, key);
    if (duplicates.length > 0) {
      await this.repo.deleteByIds(
        userId,
        duplicates.map((row) => row.id),
      );
    }
    const item = await this.repo.insert(userId, query);
    if (!item) {
      throw new ValidationError('Не удалось сохранить запрос');
    }
    await this.repo.trimToLimit(userId, MAX_SEARCH_HISTORY);
    return { item };
  }

  async remove(userId: string, id: string) {
    const deleted = await this.repo.deleteByIds(userId, [id]);
    if (deleted.length === 0) {
      throw new ValidationError('Запрос не найден');
    }
  }

  clear(userId: string) {
    return this.repo.clear(userId);
  }
}
