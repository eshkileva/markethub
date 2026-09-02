import { z } from 'zod';
import { COUNTRY_CODES } from '../geo/countries.js';
import { CURRENCY_CODES } from '../geo/currencies.js';
import {
  ATTRIBUTE_TYPES,
  AUTH_PROVIDERS,
  CATALOG_KINDS,
  DELIVERY_MODES,
  LISTING_CONDITIONS,
  LISTING_STATUSES,
  NOTIFICATION_TYPES,
  REPORT_REASONS,
  REPORT_STATUSES,
  USER_ROLES,
} from '../enums.js';

export const countryCodeSchema = z.enum(COUNTRY_CODES);
export const currencyCodeSchema = z.enum(CURRENCY_CODES);
export const authProviderSchema = z.enum(AUTH_PROVIDERS);
export const userRoleSchema = z.enum(USER_ROLES);
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
  acceptedTerms: z.boolean().refine((value) => value === true, {
    message: 'Чтобы создать аккаунт, примите условия сервиса',
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export const updateProfileSchema = z.object({
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
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Код должен состоять из 6 цифр'),
});

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable().optional(),
  country: countryCodeSchema,
  city: z.string().nullable(),
  trustScore: z.number(),
  isVerified: z.boolean(),
  role: userRoleSchema,
  emailVerified: z.boolean(),
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int(),
  user: authUserSchema,
  devVerificationCode: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Введите корректный email'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Введите корректный email'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Код должен состоять из 6 цифр'),
  newPassword: z.string().min(8, 'Пароль не короче 8 символов').max(128, 'Пароль слишком длинный'),
});

export const listingCopilotRequestSchema = z.object({
  imageUrl: z.string().url(),
  hint: z.string().trim().max(500).optional(),
  country: countryCodeSchema,
  city: z.string().trim().max(80).optional(),
  price: z.coerce.number().positive().optional(),
  currency: currencyCodeSchema.optional(),
});

export const listingReassessSchema = z.object({
  categoryId: z.string().uuid(),
  country: countryCodeSchema,
  currency: currencyCodeSchema,
  price: z.coerce.number().positive().optional(),
  baseRiskScore: z.number().int().min(0).max(100),
  sellerTrustScore: z.number().int().min(0).max(100),
  reasons: z.array(z.string().trim().min(1).max(200)).max(8).default([]),
});

export const listingPriceInsightQuerySchema = z.object({
  categoryId: z.string().uuid(),
  country: countryCodeSchema,
  currency: currencyCodeSchema,
});

export const listingAiAssessmentSchema = z.object({
  riskScore: z.number().int().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high']),
  baseRiskScore: z.number().int().min(0).max(100),
  reasons: z.array(z.string().trim().min(1).max(200)).max(8),
  sellerTrustScore: z.number().int().min(0).max(100),
  listingTrustScore: z.number().int().min(0).max(100),
  price: z.object({
    min: z.number().nullable(),
    max: z.number().nullable(),
    median: z.number().nullable(),
    sampleSize: z.number().int().min(0),
    verdict: z.enum(['low', 'fair', 'high', 'unknown']),
    currency: currencyCodeSchema,
  }),
  model: z.string().min(1).max(120),
  assessedAt: z.string().datetime(),
});

export const listingCopilotAttributeSchema = z.object({
  attributeId: z.string().uuid(),
  key: z.string(),
  labelRu: z.string(),
  value: z.string(),
});

export const listingCopilotResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  categoryId: z.string().uuid(),
  categorySlug: z.string(),
  condition: listingConditionSchema,
  attributes: z.array(listingCopilotAttributeSchema),
  suggestedPrice: z.number().nullable(),
  assessment: listingAiAssessmentSchema,
  aiEnabled: z.boolean(),
});

export const listingReassessResponseSchema = z.object({
  assessment: listingAiAssessmentSchema,
});

export const listingPriceInsightResponseSchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
  median: z.number().nullable(),
  sampleSize: z.number().int(),
  currency: currencyCodeSchema,
});

export const publishListingSchema = z.object({
  aiAssessment: listingAiAssessmentSchema.optional(),
});

export const moderationQueueQuerySchema = paginationQuerySchema.extend({
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
});

export const moderationRejectSchema = z.object({
  note: z.string().trim().min(3, 'Укажите причину отклонения').max(500),
});

export const searchIntentRequestSchema = z.object({
  q: z.string().trim().min(2, 'Введите запрос').max(200),
  country: countryCodeSchema.optional(),
});

export const searchIntentResponseSchema = z.object({
  q: z.string().trim().max(200).optional(),
  categorySlug: z.string().trim().max(80).optional(),
  country: countryCodeSchema.optional(),
  city: z.string().trim().max(80).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  currency: currencyCodeSchema.optional(),
  condition: listingConditionSchema.optional(),
  aiEnabled: z.boolean(),
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

export const createListingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, 'Заголовок не короче 4 символов')
    .max(120, 'Заголовок не длиннее 120 символов'),
  description: z
    .string()
    .trim()
    .min(10, 'Описание не короче 10 символов')
    .max(10_000, 'Описание слишком длинное'),
  categoryId: z.string().uuid('Выберите подкатегорию'),
  price: z.coerce
    .number({ message: 'Укажите цену' })
    .refine((value) => Number.isFinite(value) && value > 0, 'Цена должна быть больше 0'),
  currency: currencyCodeSchema,
  country: countryCodeSchema,
  city: z.string().trim().min(1, 'Укажите город').max(80, 'Название города слишком длинное'),
  condition: listingConditionSchema,
  deliveryModes: z.array(deliveryModeSchema).min(1, 'Выберите хотя бы один способ передачи'),
  attributes: z.array(
    z.object({
      attributeId: z.string().uuid(),
      value: z.string().max(500, 'Слишком длинное значение'),
    }),
  ),
});

export const catalogKindSchema = z.enum(CATALOG_KINDS);

export const catalogBrandsQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
});

export const catalogModelsQuerySchema = z.object({
  brand: z.string().trim().min(1).max(80),
  q: z.string().trim().max(80).optional(),
});

export const recordSearchHistorySchema = z.object({
  query: z.string().trim().min(2).max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type ListingCopilotResponse = z.infer<typeof listingCopilotResponseSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type ListingFilterInput = z.infer<typeof listingFilterSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
