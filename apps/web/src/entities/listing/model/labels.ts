import type { DeliveryMode, ListingCondition } from '@markethub/shared';

export const listingConditionLabels: Record<ListingCondition, string> = {
  new: 'Новое',
  used: 'Б/у',
  for_parts: 'На запчасти',
};

export const deliveryModeLabels: Record<DeliveryMode, string> = {
  meetup: 'Встреча',
  courier: 'Курьер',
  post: 'Почта',
  pickup: 'Самовывоз',
};
