export const AI_PLATFORM_NAME = 'Купилко AI';

export const AI_PLATFORM_TAGLINE = 'Маркетплэйс, где AI помогает и покупать, и продавать';

export const AI_HERO_HEADLINE = 'AI уже внутри каждой сделки';

export const AI_HERO_SUBLINE =
  'Не просто «кнопка ChatGPT» — умный поиск, copilot продавца, Trust Score и подсказки покупателю встроены в продукт.';

export const AI_GLOBAL_STRIP =
  'AI-native маркетплэйс · Умный поиск · Copilot по фото · Trust Score · Подсказки в чате · Честная цена';

export type AiFeaturePitch = {
  title: string;
  description: string;
  forRole: 'buyer' | 'seller' | 'both';
};

export const AI_FEATURE_PITCHES: AiFeaturePitch[] = [
  {
    title: 'Умный поиск',
    description: 'Пишите как человеку: «ноутбук до 50 000 в Минске» — AI сам разложит на фильтры.',
    forRole: 'buyer',
  },
  {
    title: 'Copilot продавца',
    description: 'Загрузите фото — AI предложит заголовок, описание, категорию и рыночную цену.',
    forRole: 'seller',
  },
  {
    title: 'Trust Score',
    description: 'Оценка объявления и продавца на карточке — видно до того, как написали в чат.',
    forRole: 'both',
  },
  {
    title: 'Честная цена',
    description:
      'Бейдж «Выгодно» / «Рыночная» / «Выше рынка» — по похожим объявлениям в категории.',
    forRole: 'buyer',
  },
  {
    title: 'Подсказки в чате',
    description: 'AI подскажет, что спросить у продавца, и предупредит о подозрительных фразах.',
    forRole: 'buyer',
  },
  {
    title: 'Модерация с AI',
    description: 'Рискованные объявления уходят в очередь — безопаснее для покупателей и площадки.',
    forRole: 'seller',
  },
];

export type AiPageId =
  | 'home'
  | 'catalog'
  | 'create-listing'
  | 'listing-detail'
  | 'my-listings'
  | 'messages'
  | 'favorites'
  | 'auth';

export const AI_PAGE_PITCHES: Record<AiPageId, { headline: string; subline: string }> = {
  home: {
    headline: AI_HERO_HEADLINE,
    subline: AI_HERO_SUBLINE,
  },
  catalog: {
    headline: 'Ищите с AI — как в обычном разговоре',
    subline:
      'Enter в поиске запускает умный разбор запроса. На карточках — Trust Score и вердикт по цене.',
  },
  'create-listing': {
    headline: 'Продавайте быстрее с AI Copilot',
    subline:
      'Фото → черновик объявления. При публикации сервер сам пересчитает Trust Score — без подделки.',
  },
  'listing-detail': {
    headline: 'Покупайте осознанно — AI уже проверил',
    subline:
      'Trust Score, рыночная цена и чеклист «что проверить» — до первого сообщения продавцу.',
  },
  'my-listings': {
    headline: 'Ваши объявления под защитой AI',
    subline:
      'Trust Score влияет на модерацию и доверие покупателей. Copilot поможет оформить новое.',
  },
  messages: {
    headline: 'Чат с AI-подсказками',
    subline: 'Готовые вопросы по категории товара и предупреждения о мошеннических фразах.',
  },
  favorites: {
    headline: 'Сравнивайте с AI-сигналами',
    subline: 'Trust Score и «Выгодно / Рыночная / Выше рынка» прямо на сохранённых карточках.',
  },
  auth: {
    headline: 'Войдите в AI-native маркетплэйс',
    subline: 'Один аккаунт для BY · RU · KZ — с умным поиском, copilot и Trust Score.',
  },
};
