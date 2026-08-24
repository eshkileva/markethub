import type { ListingStatus } from '@markethub/shared';

export const listingStatusLabels: Record<ListingStatus, string> = {
  draft: 'Черновик',
  pending_moderation: 'На модерации',
  published: 'В продаже',
  reserved: 'Бронь',
  sold: 'Продано',
  archived: 'Снято',
  rejected: 'Отклонено',
};

export const listingStatusClass: Record<ListingStatus, string> = {
  draft: 'bg-slate-100 text-muted',
  pending_moderation: 'bg-warning/10 text-warning',
  published: 'bg-success/10 text-success',
  reserved: 'bg-blue-50 text-blue-700',
  sold: 'bg-primary/10 text-primary',
  archived: 'bg-slate-100 text-muted',
  rejected: 'bg-danger/10 text-danger',
};

export const DEAL_STATUSES = ['published', 'reserved', 'sold'] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export function isDealStatus(status: string): status is DealStatus {
  return (DEAL_STATUSES as readonly string[]).includes(status);
}
