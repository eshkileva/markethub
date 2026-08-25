import { COUNTRY_CODES, type CountryCode } from './countries.js';

export type City = {
  nameRu: string;
  country: CountryCode;
};

const BY_CITIES = [
  'Минск',
  'Брест',
  'Витебск',
  'Гомель',
  'Гродно',
  'Могилёв',
  'Барановичи',
  'Борисов',
  'Пинск',
  'Орша',
  'Мозырь',
  'Солигорск',
  'Новополоцк',
  'Лида',
  'Молодечно',
  'Полоцк',
  'Жлобин',
  'Светлогорск',
  'Речица',
  'Жодино',
] as const;

const RU_CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Новосибирск',
  'Екатеринбург',
  'Казань',
  'Нижний Новгород',
  'Челябинск',
  'Самара',
  'Ростов-на-Дону',
  'Уфа',
  'Красноярск',
  'Воронеж',
  'Пермь',
  'Волгоград',
  'Краснодар',
  'Тюмень',
  'Саратов',
  'Тольятти',
  'Ижевск',
  'Барнаул',
  'Иркутск',
  'Хабаровск',
  'Ярославль',
  'Владивосток',
  'Махачкала',
  'Томск',
  'Оренбург',
  'Кемерово',
  'Рязань',
  'Набережные Челны',
  'Астрахань',
  'Пенза',
  'Липецк',
  'Киров',
  'Чебоксары',
  'Калининград',
  'Тула',
  'Курск',
  'Сочи',
  'Ставрополь',
  'Ульяновск',
  'Магнитогорск',
  'Белгород',
] as const;

const KZ_CITIES = [
  'Астана',
  'Алматы',
  'Шымкент',
  'Актобе',
  'Караганда',
  'Тараз',
  'Павлодар',
  'Усть-Каменогорск',
  'Семей',
  'Атырау',
  'Костанай',
  'Кызылорда',
  'Уральск',
  'Петропавловск',
  'Актау',
  'Темиртау',
  'Туркестан',
  'Кокшетау',
  'Талдыкорган',
  'Экибастуз',
] as const;

const CITIES_BY_COUNTRY: Record<CountryCode, readonly string[]> = {
  BY: BY_CITIES,
  RU: RU_CITIES,
  KZ: KZ_CITIES,
};

export function listCities(country: CountryCode, query?: string): City[] {
  const needle = query?.trim().toLocaleLowerCase('ru-RU');
  return CITIES_BY_COUNTRY[country]
    .filter((nameRu) => !needle || nameRu.toLocaleLowerCase('ru-RU').includes(needle))
    .map((nameRu) => ({ nameRu, country }));
}

export function isCityInCountry(country: CountryCode, city: string): boolean {
  const normalized = city.trim().toLocaleLowerCase('ru-RU');
  return CITIES_BY_COUNTRY[country].some(
    (nameRu) => nameRu.toLocaleLowerCase('ru-RU') === normalized,
  );
}

export function defaultCityForCountry(country: CountryCode): string {
  return CITIES_BY_COUNTRY[country][0] ?? '';
}

export function isSupportedCountry(value: string): value is CountryCode {
  return COUNTRY_CODES.includes(value as CountryCode);
}
