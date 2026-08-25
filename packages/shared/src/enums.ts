export const AUTH_PROVIDERS = ['email', 'google', 'vk', 'telegram'] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const USER_ROLES = ['user', 'moderator', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const LISTING_STATUSES = [
  'draft',
  'pending_moderation',
  'published',
  'reserved',
  'sold',
  'archived',
  'rejected',
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const LISTING_CONDITIONS = ['new', 'used', 'for_parts'] as const;
export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export const ATTRIBUTE_TYPES = ['string', 'number', 'enum', 'boolean'] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export const DELIVERY_MODES = ['meetup', 'courier', 'post', 'pickup'] as const;
export type DeliveryMode = (typeof DELIVERY_MODES)[number];

export const REPORT_REASONS = ['spam', 'fraud', 'prohibited', 'offensive', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = ['open', 'dismissed', 'resolved'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  'message',
  'review',
  'listing_hidden',
  'report_update',
  'listing_sold',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const CATALOG_KINDS = [
  'cars',
  'moto',
  'smartphones',
  'tablets',
  'laptops',
  'desktops',
  'pc-parts',
  'auto-parts',
  'tires',
] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export function isCatalogKind(value: string): value is CatalogKind {
  return (CATALOG_KINDS as readonly string[]).includes(value);
}
