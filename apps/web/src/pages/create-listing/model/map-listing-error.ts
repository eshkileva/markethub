import { MAX_LISTING_IMAGES } from '@markethub/shared';
import { ApiError } from '@/shared/api/client';

export const COPILOT_RATE_LIMIT_RETRY =
  'Слишком много запросов к AI. Нажмите «Сгенерировать черновик» ещё раз.';

export function mapListingError(message: string) {
  if (message === 'Sold listings cannot be edited') return 'Проданное объявление нельзя изменить';
  if (message === 'Keep at least one image on an active listing') {
    return 'У активного объявления должно остаться хотя бы одно фото';
  }
  if (message === 'Add at least one image before publishing') {
    return 'Добавьте хотя бы одно фото перед публикацией';
  }
  if (message.startsWith('Missing required attributes:')) {
    return message.replace('Missing required attributes:', 'Заполните характеристики:');
  }
  if (message.startsWith('Maximum ')) {
    return `Можно загрузить не больше ${MAX_LISTING_IMAGES} фото`;
  }
  if (message === 'File must be 5 MB or smaller') {
    return 'Файл больше 5 МБ';
  }
  if (message.includes('String must contain at least 1 character')) {
    return 'Заполните обязательное поле';
  }
  if (message.includes('Invalid uuid')) {
    return 'Выберите категорию';
  }
  if (message.includes('Достигнут дневной лимит AI')) {
    return message;
  }
  if (
    message.includes('AI provider error: 429') ||
    message.includes('Слишком много запросов к AI')
  ) {
    return COPILOT_RATE_LIMIT_RETRY;
  }
  return message;
}

export function mapCopilotError(err: unknown) {
  if (err instanceof ApiError && (err.status === 429 || err.code === 'RATE_LIMIT')) {
    if (err.message.includes('дневной лимит')) return err.message;
    return COPILOT_RATE_LIMIT_RETRY;
  }
  if (err instanceof Error) return mapListingError(err.message);
  return 'AI copilot недоступен';
}
