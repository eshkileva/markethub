export type SeedAttributeDef = {
  key: string;
  labelRu: string;
  type: 'string' | 'number' | 'enum' | 'boolean';
  options?: string[];
  required: boolean;
  sortOrder: number;
  dictionary?:
    | 'cars'
    | 'moto'
    | 'smartphones'
    | 'tablets'
    | 'laptops'
    | 'desktops'
    | 'pc-parts'
    | 'auto-parts'
    | 'tires';
  parentKey?: string;
};

const ELECTRONICS_BRAND: SeedAttributeDef = {
  key: 'brand',
  labelRu: 'Бренд',
  type: 'enum',
  options: ['Apple', 'Samsung', 'Sony', 'Xiaomi', 'LG', 'Другое'],
  required: false,
  sortOrder: 1,
};

const APPLIANCE_BRAND: SeedAttributeDef = {
  key: 'brand',
  labelRu: 'Бренд',
  type: 'enum',
  options: ['Bosch', 'Samsung', 'LG', 'Indesit', 'DeLonghi', 'Другое'],
  required: false,
  sortOrder: 1,
};

const COMPUTER_CORE: SeedAttributeDef[] = [
  {
    key: 'manufacturer',
    labelRu: 'Производитель',
    type: 'string',
    required: true,
    sortOrder: 1,
  },
  {
    key: 'model',
    labelRu: 'Модель',
    type: 'string',
    required: false,
    sortOrder: 2,
    parentKey: 'manufacturer',
  },
];

const PHONE_CORE: SeedAttributeDef[] = [
  {
    key: 'brand',
    labelRu: 'Бренд',
    type: 'string',
    required: true,
    sortOrder: 1,
  },
  {
    key: 'model',
    labelRu: 'Модель',
    type: 'string',
    required: false,
    sortOrder: 2,
    parentKey: 'brand',
  },
];

const PARTS_CORE: SeedAttributeDef[] = [
  {
    key: 'brand',
    labelRu: 'Производитель',
    type: 'string',
    required: true,
    sortOrder: 1,
  },
  {
    key: 'model',
    labelRu: 'Наименование',
    type: 'string',
    required: false,
    sortOrder: 2,
    parentKey: 'brand',
  },
];

const REALTY_DEAL: SeedAttributeDef = {
  key: 'deal_type',
  labelRu: 'Тип сделки',
  type: 'enum',
  options: ['Продажа', 'Аренда'],
  required: true,
  sortOrder: 1,
};

const PET_ANIMAL_CORE: SeedAttributeDef[] = [
  {
    key: 'breed',
    labelRu: 'Порода',
    type: 'string',
    required: false,
    sortOrder: 2,
  },
  {
    key: 'age',
    labelRu: 'Возраст',
    type: 'enum',
    options: ['Щенок/Котёнок', 'Молодой', 'Взрослый', 'Пожилой'],
    required: false,
    sortOrder: 3,
  },
  {
    key: 'gender',
    labelRu: 'Пол',
    type: 'enum',
    options: ['Мальчик', 'Девочка'],
    required: false,
    sortOrder: 4,
  },
];

const AUTO_CORE: SeedAttributeDef[] = [
  {
    key: 'brand',
    labelRu: 'Марка',
    type: 'string',
    required: true,
    sortOrder: 1,
  },
  {
    key: 'model',
    labelRu: 'Модель',
    type: 'string',
    required: false,
    sortOrder: 2,
    parentKey: 'brand',
  },
  {
    key: 'year',
    labelRu: 'Год',
    type: 'number',
    required: false,
    sortOrder: 3,
  },
  {
    key: 'mileage',
    labelRu: 'Пробег, км',
    type: 'number',
    required: false,
    sortOrder: 4,
  },
];

export const CATEGORY_ATTRIBUTE_DEFS: Record<string, SeedAttributeDef[]> = {
  'tv-video': [ELECTRONICS_BRAND],
  audio: [ELECTRONICS_BRAND],
  consoles: [ELECTRONICS_BRAND],
  photo: [ELECTRONICS_BRAND],
  laptops: [
    ...COMPUTER_CORE.map((item) => ({ ...item, dictionary: 'laptops' as const })),
    {
      key: 'memory',
      labelRu: 'ОЗУ',
      type: 'enum',
      options: ['8 ГБ', '16 ГБ', '32 ГБ', '64 ГБ'],
      required: false,
      sortOrder: 3,
    },
    {
      key: 'chipset',
      labelRu: 'Процессор',
      type: 'string',
      required: false,
      sortOrder: 4,
    },
    {
      key: 'storage',
      labelRu: 'Накопитель',
      type: 'enum',
      options: ['256 ГБ', '512 ГБ', '1 ТБ', '2 ТБ'],
      required: false,
      sortOrder: 5,
    },
  ],
  desktops: [
    ...COMPUTER_CORE.map((item) => ({ ...item, dictionary: 'desktops' as const })),
    {
      key: 'memory',
      labelRu: 'ОЗУ',
      type: 'enum',
      options: ['8 ГБ', '16 ГБ', '32 ГБ', '64 ГБ'],
      required: false,
      sortOrder: 3,
    },
    {
      key: 'chipset',
      labelRu: 'Процессор',
      type: 'string',
      required: false,
      sortOrder: 4,
    },
    {
      key: 'storage',
      labelRu: 'Накопитель',
      type: 'enum',
      options: ['256 ГБ', '512 ГБ', '1 ТБ', '2 ТБ'],
      required: false,
      sortOrder: 5,
    },
  ],
  'pc-parts': COMPUTER_CORE.map((item) => ({ ...item, dictionary: 'pc-parts' as const })),
  smartphones: [
    ...PHONE_CORE.map((item) => ({ ...item, dictionary: 'smartphones' as const })),
    {
      key: 'storage',
      labelRu: 'Память',
      type: 'enum',
      options: ['64', '128', '256', '512'],
      required: false,
      sortOrder: 3,
    },
    {
      key: 'color',
      labelRu: 'Цвет',
      type: 'enum',
      options: ['Чёрный', 'Белый', 'Синий', 'Золотой', 'Другой'],
      required: false,
      sortOrder: 4,
    },
  ],
  tablets: PHONE_CORE.map((item) => ({ ...item, dictionary: 'tablets' as const })),
  'large-appliances': [APPLIANCE_BRAND],
  'small-appliances': [APPLIANCE_BRAND],
  cars: [
    ...AUTO_CORE.map((item) => ({ ...item, dictionary: 'cars' as const })),
    {
      key: 'fuel',
      labelRu: 'Топливо',
      type: 'enum',
      options: ['Бензин', 'Дизель', 'Гибрид', 'Электро'],
      required: false,
      sortOrder: 5,
    },
  ],
  moto: AUTO_CORE.map((item) => ({ ...item, dictionary: 'moto' as const })),
  'auto-parts': PARTS_CORE.map((item) => ({ ...item, dictionary: 'auto-parts' as const })),
  tires: PARTS_CORE.map((item) => ({ ...item, dictionary: 'tires' as const })),
  apartments: [
    REALTY_DEAL,
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
    {
      key: 'floor',
      labelRu: 'Этаж',
      type: 'number',
      required: false,
      sortOrder: 4,
    },
  ],
  houses: [
    REALTY_DEAL,
    {
      key: 'area',
      labelRu: 'Площадь, м²',
      type: 'number',
      required: false,
      sortOrder: 2,
    },
    {
      key: 'land_area',
      labelRu: 'Участок, сот.',
      type: 'number',
      required: false,
      sortOrder: 3,
    },
  ],
  rooms: [
    REALTY_DEAL,
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
  land: [
    REALTY_DEAL,
    {
      key: 'area',
      labelRu: 'Площадь, м²',
      type: 'number',
      required: false,
      sortOrder: 2,
    },
  ],
  dogs: PET_ANIMAL_CORE,
  cats: PET_ANIMAL_CORE,
  'other-pets': [
    {
      key: 'species',
      labelRu: 'Вид',
      type: 'string',
      required: false,
      sortOrder: 1,
    },
    ...PET_ANIMAL_CORE,
  ],
  'pet-supplies': [
    {
      key: 'product_type',
      labelRu: 'Тип товара',
      type: 'enum',
      options: ['Корм', 'Игрушки', 'Аксессуары', 'Гигиена', 'Другое'],
      required: false,
      sortOrder: 1,
    },
  ],
  vacancies: [
    {
      key: 'profession',
      labelRu: 'Должность',
      type: 'string',
      required: true,
      sortOrder: 1,
    },
    {
      key: 'employment',
      labelRu: 'Занятость',
      type: 'enum',
      options: ['Полная', 'Частичная', 'Удалённая', 'Проектная'],
      required: false,
      sortOrder: 2,
    },
    {
      key: 'experience',
      labelRu: 'Опыт',
      type: 'enum',
      options: ['Без опыта', '1–3 года', '3–6 лет', '6+ лет'],
      required: false,
      sortOrder: 3,
    },
    {
      key: 'salary_from',
      labelRu: 'Зарплата от',
      type: 'number',
      required: false,
      sortOrder: 4,
    },
  ],
  resumes: [
    {
      key: 'profession',
      labelRu: 'Специальность',
      type: 'string',
      required: true,
      sortOrder: 1,
    },
    {
      key: 'experience',
      labelRu: 'Опыт',
      type: 'enum',
      options: ['Без опыта', '1–3 года', '3–6 лет', '6+ лет'],
      required: false,
      sortOrder: 2,
    },
    {
      key: 'schedule',
      labelRu: 'График',
      type: 'enum',
      options: ['Полный день', 'Сменный', 'Гибкий', 'Удалённо'],
      required: false,
      sortOrder: 3,
    },
  ],
  clothes: [
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
  shoes: [
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
  furniture: [
    {
      key: 'material',
      labelRu: 'Материал',
      type: 'enum',
      options: ['Дерево', 'Металл', 'Ткань', 'Пластик', 'Другое'],
      required: false,
      sortOrder: 1,
    },
  ],
  decor: [
    {
      key: 'material',
      labelRu: 'Материал',
      type: 'enum',
      options: ['Дерево', 'Металл', 'Ткань', 'Пластик', 'Другое'],
      required: false,
      sortOrder: 1,
    },
  ],
  repair: [
    {
      key: 'material',
      labelRu: 'Материал',
      type: 'enum',
      options: ['Дерево', 'Металл', 'Ткань', 'Пластик', 'Другое'],
      required: false,
      sortOrder: 1,
    },
  ],
  garden: [
    {
      key: 'material',
      labelRu: 'Материал',
      type: 'enum',
      options: ['Дерево', 'Металл', 'Ткань', 'Пластик', 'Другое'],
      required: false,
      sortOrder: 1,
    },
  ],
  'kids-clothes': [
    {
      key: 'size',
      labelRu: 'Размер',
      type: 'enum',
      options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      required: false,
      sortOrder: 1,
    },
    {
      key: 'season',
      labelRu: 'Сезон',
      type: 'enum',
      options: ['Лето', 'Зима', 'Демисезон', 'Всесезон'],
      required: false,
      sortOrder: 2,
    },
  ],
};

export const DEMO_LISTING_ATTRIBUTES: Record<string, Record<string, string>> = {
  iphone13: { brand: 'Apple', storage: '128', color: 'Синий' },
  macbook: { manufacturer: 'Apple', memory: '8 ГБ', chipset: 'M1', storage: '256 ГБ' },
  washer: { brand: 'Samsung' },
  jacket: { size: 'L', gender: 'Мужское', season: 'Зима' },
  sofa: { material: 'Ткань' },
  monitor: { brand: 'Другое' },
  headphones: { brand: 'Sony' },
  ps5: { brand: 'Sony' },
  coffee: { brand: 'DeLonghi' },
};
