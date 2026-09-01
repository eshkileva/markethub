export const DOMAIN_EVENTS = {
  UserRegistered: 'UserRegistered',
  ListingPublished: 'ListingPublished',
  ListingQueued: 'ListingQueued',
  ListingRejected: 'ListingRejected',
  ListingUpdated: 'ListingUpdated',
  ListingSold: 'ListingSold',
  MessageSent: 'MessageSent',
  ReviewCreated: 'ReviewCreated',
  ReportCreated: 'ReportCreated',
  ReportResolved: 'ReportResolved',
  UserVerified: 'UserVerified',
} as const;

export type DomainEventName = (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];

export type DomainEvent<TName extends DomainEventName = DomainEventName, TPayload = unknown> = {
  name: TName;
  occurredAt: string;
  payload: TPayload;
};
