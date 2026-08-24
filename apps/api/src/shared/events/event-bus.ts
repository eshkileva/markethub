import { DOMAIN_EVENTS, type DomainEvent, type DomainEventName } from '@markethub/shared';

export type EventHandler = (event: DomainEvent) => Promise<void> | void;

export interface EventBus {
  publish<T>(name: DomainEventName, payload: T): Promise<void>;
  subscribe(name: DomainEventName, handler: EventHandler): void;
}

export class InProcessEventBus implements EventBus {
  private readonly handlers = new Map<DomainEventName, EventHandler[]>();

  subscribe(name: DomainEventName, handler: EventHandler): void {
    const list = this.handlers.get(name) ?? [];
    list.push(handler);
    this.handlers.set(name, list);
  }

  async publish<T>(name: DomainEventName, payload: T): Promise<void> {
    const event: DomainEvent = {
      name,
      occurredAt: new Date().toISOString(),
      payload,
    };
    const list = this.handlers.get(name) ?? [];
    for (const handler of list) {
      await handler(event);
    }
  }
}

export { DOMAIN_EVENTS };
