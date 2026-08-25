export const SEED_ROOTS = [
  { slug: 'electronics', nameRu: 'Электроника', icon: 'cpu', sortOrder: 1 },
  { slug: 'computers', nameRu: 'Компьютеры', icon: 'monitor', sortOrder: 2 },
  { slug: 'phones', nameRu: 'Телефоны', icon: 'smartphone', sortOrder: 3 },
  { slug: 'appliances', nameRu: 'Бытовая техника', icon: 'washing-machine', sortOrder: 4 },
  { slug: 'auto', nameRu: 'Авто', icon: 'car', sortOrder: 5 },
  { slug: 'realty', nameRu: 'Недвижимость', icon: 'home', sortOrder: 6 },
  { slug: 'hobby', nameRu: 'Хобби и отдых', icon: 'bike', sortOrder: 7 },
  { slug: 'fashion', nameRu: 'Одежда и обувь', icon: 'shirt', sortOrder: 8 },
  { slug: 'home-garden', nameRu: 'Дом и сад', icon: 'flower-2', sortOrder: 9 },
  { slug: 'kids', nameRu: 'Детские товары', icon: 'baby', sortOrder: 10 },
  { slug: 'animals', nameRu: 'Животные', icon: 'paw-print', sortOrder: 11 },
  { slug: 'services', nameRu: 'Услуги', icon: 'hand-helping', sortOrder: 12 },
  { slug: 'jobs', nameRu: 'Работа', icon: 'briefcase', sortOrder: 13 },
] as const;

export const SEED_LEAVES = [
  { slug: 'tv-video', nameRu: 'ТВ и видео', parentSlug: 'electronics', sortOrder: 1 },
  { slug: 'audio', nameRu: 'Аудио', parentSlug: 'electronics', sortOrder: 2 },
  { slug: 'consoles', nameRu: 'Игровые приставки', parentSlug: 'electronics', sortOrder: 3 },
  { slug: 'photo', nameRu: 'Фото', parentSlug: 'electronics', sortOrder: 4 },
  { slug: 'laptops', nameRu: 'Ноутбуки', parentSlug: 'computers', sortOrder: 1 },
  { slug: 'desktops', nameRu: 'ПК', parentSlug: 'computers', sortOrder: 2 },
  { slug: 'pc-parts', nameRu: 'Комплектующие', parentSlug: 'computers', sortOrder: 3 },
  { slug: 'smartphones', nameRu: 'Смартфоны', parentSlug: 'phones', sortOrder: 1 },
  { slug: 'tablets', nameRu: 'Планшеты', parentSlug: 'phones', sortOrder: 2 },
  { slug: 'phone-accessories', nameRu: 'Аксессуары', parentSlug: 'phones', sortOrder: 3 },
  { slug: 'large-appliances', nameRu: 'Крупная', parentSlug: 'appliances', sortOrder: 1 },
  { slug: 'small-appliances', nameRu: 'Мелкая', parentSlug: 'appliances', sortOrder: 2 },
  { slug: 'cars', nameRu: 'Легковые', parentSlug: 'auto', sortOrder: 1 },
  { slug: 'moto', nameRu: 'Мото', parentSlug: 'auto', sortOrder: 2 },
  { slug: 'auto-parts', nameRu: 'Запчасти', parentSlug: 'auto', sortOrder: 3 },
  { slug: 'tires', nameRu: 'Шины и диски', parentSlug: 'auto', sortOrder: 4 },
  { slug: 'apartments', nameRu: 'Квартира', parentSlug: 'realty', sortOrder: 1 },
  { slug: 'houses', nameRu: 'Дом', parentSlug: 'realty', sortOrder: 2 },
  { slug: 'rooms', nameRu: 'Комната', parentSlug: 'realty', sortOrder: 3 },
  { slug: 'land', nameRu: 'Участок', parentSlug: 'realty', sortOrder: 4 },
  { slug: 'bikes', nameRu: 'Вело', parentSlug: 'hobby', sortOrder: 1 },
  { slug: 'sport', nameRu: 'Спорт', parentSlug: 'hobby', sortOrder: 2 },
  { slug: 'music', nameRu: 'Музыка', parentSlug: 'hobby', sortOrder: 3 },
  { slug: 'tourism', nameRu: 'Туризм', parentSlug: 'hobby', sortOrder: 4 },
  { slug: 'clothes', nameRu: 'Одежда', parentSlug: 'fashion', sortOrder: 1 },
  { slug: 'shoes', nameRu: 'Обувь', parentSlug: 'fashion', sortOrder: 2 },
  { slug: 'fashion-accessories', nameRu: 'Аксессуары', parentSlug: 'fashion', sortOrder: 3 },
  { slug: 'cosmetics', nameRu: 'Косметика', parentSlug: 'fashion', sortOrder: 4 },
  { slug: 'furniture', nameRu: 'Мебель', parentSlug: 'home-garden', sortOrder: 1 },
  { slug: 'decor', nameRu: 'Декор', parentSlug: 'home-garden', sortOrder: 2 },
  { slug: 'repair', nameRu: 'Ремонт', parentSlug: 'home-garden', sortOrder: 3 },
  { slug: 'garden', nameRu: 'Сад', parentSlug: 'home-garden', sortOrder: 4 },
  { slug: 'kids-clothes', nameRu: 'Одежда', parentSlug: 'kids', sortOrder: 1 },
  { slug: 'toys', nameRu: 'Игрушки', parentSlug: 'kids', sortOrder: 2 },
  { slug: 'strollers', nameRu: 'Коляски и автокресла', parentSlug: 'kids', sortOrder: 3 },
  { slug: 'kids-furniture', nameRu: 'Детская мебель', parentSlug: 'kids', sortOrder: 4 },
  { slug: 'dogs', nameRu: 'Собаки', parentSlug: 'animals', sortOrder: 1 },
  { slug: 'cats', nameRu: 'Кошки', parentSlug: 'animals', sortOrder: 2 },
  { slug: 'other-pets', nameRu: 'Другие животные', parentSlug: 'animals', sortOrder: 3 },
  { slug: 'pet-supplies', nameRu: 'Товары для животных', parentSlug: 'animals', sortOrder: 4 },
  { slug: 'service-repair', nameRu: 'Ремонт техники', parentSlug: 'services', sortOrder: 1 },
  { slug: 'handyman', nameRu: 'Мастер на час', parentSlug: 'services', sortOrder: 2 },
  { slug: 'cleaning', nameRu: 'Уборка', parentSlug: 'services', sortOrder: 3 },
  { slug: 'service-beauty', nameRu: 'Красота', parentSlug: 'services', sortOrder: 4 },
  { slug: 'moving', nameRu: 'Переезды', parentSlug: 'services', sortOrder: 5 },
  { slug: 'vacancies', nameRu: 'Вакансии', parentSlug: 'jobs', sortOrder: 1 },
  { slug: 'resumes', nameRu: 'Резюме', parentSlug: 'jobs', sortOrder: 2 },
] as const;

export function leafSlugForRoot(rootSlug: string, kind?: string | null): string {
  const value = kind?.trim();
  switch (rootSlug) {
    case 'electronics':
      if (value === 'Наушники' || value === 'Колонка') return 'audio';
      if (value === 'Приставка') return 'consoles';
      if (value === 'Фото') return 'photo';
      return 'tv-video';
    case 'computers':
      return 'laptops';
    case 'phones':
      return 'smartphones';
    case 'appliances':
      if (value === 'Кофемашина' || value === 'Пылесос') return 'small-appliances';
      return 'large-appliances';
    case 'auto':
      return 'cars';
    case 'realty':
      if (value === 'Дом') return 'houses';
      if (value === 'Комната') return 'rooms';
      if (value === 'Участок') return 'land';
      return 'apartments';
    case 'hobby':
      if (value === 'Спорт') return 'sport';
      if (value === 'Музыка') return 'music';
      if (value === 'Туризм') return 'tourism';
      return 'bikes';
    case 'fashion':
      return 'clothes';
    case 'home-garden':
      if (value === 'Декор') return 'decor';
      if (value === 'Инструмент') return 'repair';
      if (value === 'Сад') return 'garden';
      return 'furniture';
    default:
      return rootSlug;
  }
}
