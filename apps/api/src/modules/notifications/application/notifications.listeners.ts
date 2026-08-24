import type { EventBus } from '../../../shared/events/event-bus.js';
import type { NotificationsService } from './notifications.service.js';

export function registerNotificationHandlers(
  events: EventBus,
  notifications: NotificationsService,
) {
  events.subscribe('MessageSent', async (event) => {
    try {
      await notifications.handleMessageSent(event.payload);
    } catch (error) {
      console.error('notification handler failed', error);
    }
  });
  events.subscribe('ReviewCreated', async (event) => {
    try {
      await notifications.handleReviewCreated(event.payload);
    } catch (error) {
      console.error('notification handler failed', error);
    }
  });
  events.subscribe('ReportResolved', async (event) => {
    try {
      await notifications.handleReportResolved(event.payload);
    } catch (error) {
      console.error('notification handler failed', error);
    }
  });
  events.subscribe('ListingSold', async (event) => {
    try {
      await notifications.handleListingSold(event.payload);
    } catch (error) {
      console.error('notification handler failed', error);
    }
  });
}
