import amqp, { type Channel, type ChannelModel } from 'amqplib';
import type { DomainEventName } from '@markethub/shared';
import type { AppConfig } from '../../config/env.js';
import type { EventBus, EventHandler } from '../../shared/events/event-bus.js';
import { InProcessEventBus } from '../../shared/events/event-bus.js';

/**
 * Dual bus: always publishes in-process; optionally mirrors to RabbitMQ later.
 * When RABBITMQ_ENABLED=false, Rabbit connection is skipped.
 */
export class HybridEventBus implements EventBus {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly local = new InProcessEventBus();

  constructor(
    private readonly config: AppConfig,
    private readonly logger: {
      warn: (obj: unknown, msg?: string) => void;
      info: (obj: unknown, msg?: string) => void;
    },
  ) {}

  subscribe(name: DomainEventName, handler: EventHandler): void {
    this.local.subscribe(name, handler);
  }

  async connect(): Promise<void> {
    if (!this.config.RABBITMQ_ENABLED) {
      this.logger.info({}, 'RabbitMQ disabled; using in-process event bus only');
      return;
    }
    try {
      this.connection = await amqp.connect(this.config.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange('markethub.events', 'topic', { durable: true });
      this.logger.info({}, 'RabbitMQ connected');
    } catch (error) {
      this.logger.warn({ err: error }, 'RabbitMQ unavailable; continuing with in-process bus');
    }
  }

  async publish<T>(name: DomainEventName, payload: T): Promise<void> {
    await this.local.publish(name, payload);
    if (!this.channel) return;
    const body = Buffer.from(
      JSON.stringify({
        name,
        occurredAt: new Date().toISOString(),
        payload,
      }),
    );
    this.channel.publish('markethub.events', name, body, {
      contentType: 'application/json',
      persistent: true,
    });
  }

  async close(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
