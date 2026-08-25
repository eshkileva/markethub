export type SeedAttributeDef = {
  key: string;
  labelRu: string;
  type: 'string' | 'number' | 'enum' | 'boolean';
  options?: string[];
  required: boolean;
  sortOrder: number;
};

export const CATEGORY_ATTRIBUTE_DEFS: Record<string, SeedAttributeDef[]> = {
  electronics: [
    {
      key: 'brand',
      labelRu: 'Бренд',
      type: 'enum',
      options: ['Apple', 'Samsung', 'Sony', 'Xiaomi', 'LG', 'Другое'],
      required: false,
      sortOrder: 1,
    },
    {
      key: 'kind',
      labelRu: 'Тип',
      type: 'enum',
      options: ['ТВ', 'Монитор', 'Наушники', 'Колонка', 'Приставка', 'Другое'],
      required: false,
      sortOrder: 2,
    },
  ],
  computers: [
    {
      key: 'manufacturer',
      labelRu: 'Производитель',
      type: 'enum',
      options: ['Apple', 'ASUS', 'Lenovo', 'HP', 'Dell', 'NVIDIA', 'Другое'],
      required: true,
      sortOrder: 1,
    },
    {
      key: 'memory',
      labelRu: 'ОЗУ',
      type: 'enum',
      options: ['8 ГБ', '16 ГБ', '32 ГБ', '64 ГБ'],
      required: false,
      sortOrder: 2,
    },
    {
      key: 'chipset',
      labelRu: 'Процессор',
      type: 'string',
      required: false,
      sortOrder: 3,
    },
    {
      key: 'storage',
      labelRu: 'Накопитель',
      type: 'enum',
      options: ['256 ГБ', '512 ГБ', '1 ТБ', '2 ТБ'],
      required: false,
      sortOrder: 4,
    },
  ],
  phones: [
    {
      key: 'storage',
      labelRu: 'Память',
      type: 'enum',
      options: ['64', '128', '256', '512'],
      required: true,
      sortOrder: 1,
    },
    {
      key: 'color',
      labelRu: 'Цвет',
      type: 'enum',
      options: ['Чёрный', 'Белый', 'Синий', 'Золотой', 'Другой'],
      required: false,
      sortOrder: 2,
    },
    {
      key: 'brand',
      labelRu: 'Бренд',
      type: 'enum',
      options: ['Apple', 'Samsung', 'Xiaomi', 'Google', 'Другое'],
      required: false,
      sortOrder: 3,
    },
  ],
  appliances: [
    {
      key: 'brand',
      labelRu: 'Бренд',
      type: 'enum',
      options: ['Bosch', 'Samsung', 'LG', 'Indesit', 'DeLonghi', 'Другое'],
      required: false,
      sortOrder: 1,
    },
    {
      key: 'kind',
      labelRu: 'Тип',
      type: 'enum',
      options: ['Стиральная машина', 'Холодильник', 'Плита', 'Кофемашина', 'Пылесос', 'Другое'],
      required: false,
      sortOrder: 2,
    },
  ],
  auto: [
    {
      key: 'brand',
      labelRu: 'Марка',
      type: 'enum',
      options: ['Toyota', 'Volkswagen', 'BMW', 'Hyundai', 'Lada', 'Другое'],
      required: false,
      sortOrder: 1,
    },
    {
      key: 'year',
      labelRu: 'Год',
      type: 'number',
      required: false,
      sortOrder: 2,
    },
    {
      key: 'mileage',
      labelRu: 'Пробег, км',
      type: 'number',
      required: false,
      sortOrder: 3,
    },
    {
      key: 'fuel',
      labelRu: 'Топливо',
      type: 'enum',
      options: ['Бензин', 'Дизель', 'Гибрид', 'Электро'],
      required: false,
      sortOrder: 4,
    },
  ],
  realty: [
    {
      key: 'kind',
      labelRu: 'Тип',
      type: 'enum',
      options: ['Квартира', 'Дом', 'Комната', 'Участок'],
      required: false,
      sortOrder: 1,
    },
    {
      key: 'rooms',
      labelRu: 'Комнат',
      type: 'enum',
      options: ['Студия', '1', '2', '3', '4+'],
      required: false,
      sortOrder: 2,
    },
    {
      key: 'area',
      labelRu: 'Площадь, м²',
      type: 'number',
      required: false,
      sortOrder: 3,
    },
  ],
  hobby: [
    {
      key: 'kind',
      labelRu: 'Тип',
      type: 'enum',
      options: ['Велосипед', 'Спорт', 'Музыка', 'Туризм', 'Другое'],
      required: false,
      sortOrder: 1,
    },
  ],
  fashion: [
    {
      key: 'size',
      labelRu: 'Размер',
      type: 'enum',
      options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      required: false,
      sortOrder: 1,
    },
    {
      key: 'gender',
      labelRu: 'Для кого',
      type: 'enum',
      options: ['Женское', 'Мужское', 'Унисекс', 'Детское'],
      required: false,
      sortOrder: 2,
    },
    {
      key: 'season',
      labelRu: 'Сезон',
      type: 'enum',
      options: ['Лето', 'Зима', 'Демисезон', 'Всесезон'],
      required: false,
      sortOrder: 3,
    },
  ],
  'home-garden': [
    {
      key: 'kind',
      labelRu: 'Тип',
      type: 'enum',
      options: ['Мебель', 'Декор', 'Инструмент', 'Сад', 'Другое'],
      required: false,
      sortOrder: 1,
    },
    {
      key: 'material',
      labelRu: 'Материал',
      type: 'enum',
      options: ['Дерево', 'Металл', 'Ткань', 'Пластик', 'Другое'],
      required: false,
      sortOrder: 2,
    },
  ],
};

export const DEMO_LISTING_ATTRIBUTES: Record<string, Record<string, string>> = {
  iphone13: { brand: 'Apple', storage: '128', color: 'Синий' },
  macbook: { manufacturer: 'Apple', memory: '8 ГБ', chipset: 'M1', storage: '256 ГБ' },
  washer: { brand: 'Samsung', kind: 'Стиральная машина' },
  bike: { kind: 'Велосипед' },
  jacket: { size: 'L', gender: 'Мужское', season: 'Зима' },
  sofa: { kind: 'Мебель', material: 'Ткань' },
  monitor: { brand: 'Другое', kind: 'Монитор' },
  headphones: { brand: 'Sony', kind: 'Наушники' },
  ps5: { brand: 'Sony', kind: 'Приставка' },
  coffee: { brand: 'DeLonghi', kind: 'Кофемашина' },
};
