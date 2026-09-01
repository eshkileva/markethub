import { MAX_LISTING_IMAGES } from '@markethub/shared';

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
  return message;
}
