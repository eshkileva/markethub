import { z } from 'zod';
import { COUNTRY_CODES } from '../geo/countries.js';
import { isCityInCountry } from '../geo/cities.js';
import { CURRENCY_CODES } from '../geo/currencies.js';
import {
  ATTRIBUTE_TYPES,
  AUTH_PROVIDERS,
  DELIVERY_MODES,
  LISTING_CONDITIONS,
  LISTING_STATUSES,
  NOTIFICATION_TYPES,
  REPORT_REASONS,
  REPORT_STATUSES,
} from '../enums.js';

export const countryCodeSchema = z.enum(COUNTRY_CODES);
export const currencyCodeSchema = z.enum(CURRENCY_CODES);
export const authProviderSchema = z.enum(AUTH_PROVIDERS);
export const listingStatusSchema = z.enum(LISTING_STATUSES);
export const listingConditionSchema = z.enum(LISTING_CONDITIONS);
export const attributeTypeSchema = z.enum(ATTRIBUTE_TYPES);
export const deliveryModeSchema = z.enum(DELIVERY_MODES);
export const reportReasonSchema = z.enum(REPORT_REASONS);
export const reportStatusSchema = z.enum(REPORT_STATUSES);
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const registerSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(8, 'Пароль не короче 8 символов').max(128, 'Пароль слишком длинный'),
  username: z
    .string()
    .min(3, 'Ник не короче 3 символов')
    .max(32, 'Ник не длиннее 32 символов')
    .regex(/^[a-zA-Z0-9_]+$/, 'Только латиница, цифры и подчёркивание'),
  displayName: z
    .string()
    .min(1, 'Имя не может быть пустым')
    .max(80, 'Имя слишком длинное')
    .optional(),
  country: countryCodeSchema,
});

export const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().max(80).nullable().optional(),
    bio: z.string().trim().max(500).nullable().optional(),
    city: z.string().trim().max(80).nullable().optional(),
    country: countryCodeSchema.optional(),
    avatarUrl: z.string().url().nullable().optional(),
    username: z
      .string()
      .min(3)
      .max(32)
      .regex(/^[a-zA-Z0-9_]+$/)
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.city || !value.country) return;
    if (!isCityInCountry(value.country, value.city)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['city'],
        message: 'Выберите город из списка страны',
      });
    }
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

const attrQuerySchema = z.preprocess(
  (value) => {
    if (value == null || value === '') return undefined;
    return Array.isArray(value) ? value : [value];
  },
  z.array(z.string().trim().min(1).max(160)).max(12).optional(),
);

export const listingFilterSchema = paginationQuerySchema.extend({
  q: z.string().trim().max(200).optional(),
  country: countryCodeSchema.optional(),
  city: z.string().trim().max(80).optional(),
  categoryId: z.string().uuid().optional(),
  sellerId: z.string().uuid().optional(),
  currency: currencyCodeSchema.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  condition: listingConditionSchema.optional(),
  delivery: deliveryModeSchema.optional(),
  attr: attrQuerySchema,
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
});

export const citiesQuerySchema = z.object({
  country: countryCodeSchema,
  q: z.string().trim().max(80).optional(),
});

export const listingMineQuerySchema = z.object({
  status: listingStatusSchema.optional(),
});

export const createConversationSchema = z.object({
  listingId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const createReviewSchema = z.object({
  listingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export const createReportSchema = z.object({
  listingId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  reason: reportReasonSchema,
  details: z.string().trim().max(2000).optional(),
});

export const resolveReportSchema = z.object({
  action: z.enum(['dismiss', 'hide_listing']),
});

export const reportListQuerySchema = paginationQuerySchema.extend({
  status: reportStatusSchema.default('open'),
});

export const notificationListQuerySchema = paginationQuerySchema;

export const createListingSchema = z
  .object({
    title: z.string().min(4).max(120),
    description: z.string().min(10).max(10_000),
    categoryId: z.string().uuid(),
    price: z.number().positive(),
    currency: currencyCodeSchema,
    country: countryCodeSchema,
    city: z.string().min(1).max(80),
    condition: listingConditionSchema,
    deliveryModes: z.array(deliveryModeSchema).min(1),
    attributes: z.array(
      z.object({
        attributeId: z.string().uuid(),
        value: z.string().max(500),
      }),
    ),
  })
  .superRefine((value, ctx) => {
    if (!isCityInCountry(value.country, value.city)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['city'],
        message: 'Выберите город из списка страны',
      });
    }
  });
