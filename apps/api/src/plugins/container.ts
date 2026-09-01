import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import type { AppConfig } from '../config/env.js';
import type { Database } from '../infrastructure/database/client.js';
import type { RedisClient } from '../infrastructure/redis/client.js';
import type { ObjectStorage } from '../infrastructure/storage/s3.js';
import type { HybridEventBus } from '../infrastructure/messaging/rabbitmq-event-bus.js';
import { AuthRepository } from '../modules/auth/infrastructure/auth.repository.js';
import { AuthService } from '../modules/auth/application/auth.service.js';
import { ListingsRepository } from '../modules/listings/infrastructure/listings.repository.js';
import { ListingsService } from '../modules/listings/application/listings.service.js';
import { FavoritesRepository } from '../modules/favorites/infrastructure/favorites.repository.js';
import { FavoritesService } from '../modules/favorites/application/favorites.service.js';
import { MessagingRepository } from '../modules/messaging/infrastructure/messaging.repository.js';
import { MessagingService } from '../modules/messaging/application/messaging.service.js';
import { ReviewsRepository } from '../modules/reviews/infrastructure/reviews.repository.js';
import { ReviewsService } from '../modules/reviews/application/reviews.service.js';
import { ReportsRepository } from '../modules/reports/infrastructure/reports.repository.js';
import { ReportsService } from '../modules/reports/application/reports.service.js';
import { NotificationsRepository } from '../modules/notifications/infrastructure/notifications.repository.js';
import { NotificationsService } from '../modules/notifications/application/notifications.service.js';
import { registerNotificationHandlers } from '../modules/notifications/application/notifications.listeners.js';
import { ChatHub } from '../modules/messaging/infrastructure/chat-hub.js';
import { UsersRepository } from '../modules/users/infrastructure/users.repository.js';
import { UsersService } from '../modules/users/application/users.service.js';
import { GeoService } from '../modules/geo/application/geo.service.js';
import { CitiesRepository } from '../modules/geo/infrastructure/cities.repository.js';
import { RatesService } from '../modules/fx/application/rates.service.js';
import { CatalogsRepository } from '../modules/catalogs/infrastructure/catalogs.repository.js';
import { CatalogsService } from '../modules/catalogs/application/catalogs.service.js';
import { SearchHistoryRepository } from '../modules/search/infrastructure/search-history.repository.js';
import { SearchHistoryService } from '../modules/search/application/search-history.service.js';
import { createEmailSender } from '../infrastructure/email/email-sender.js';
import { AiCallLogger } from '../infrastructure/ai/ai-call-logger.js';
import { AiUsageLimiter } from '../infrastructure/ai/ai-usage-limiter.js';
import { OpenRouterClient } from '../infrastructure/ai/openrouter.client.js';
import { ListingCopilotRepository } from '../modules/ai/infrastructure/listing-copilot.repository.js';
import { ListingCopilotService } from '../modules/ai/application/listing-copilot.service.js';
import { SearchIntentService } from '../modules/ai/application/search-intent.service.js';
import { ModerationRepository } from '../modules/moderation/infrastructure/moderation.repository.js';
import { ModerationService } from '../modules/moderation/application/moderation.service.js';

export type AppServices = {
  auth: AuthService;
  listings: ListingsService;
  favorites: FavoritesService;
  messaging: MessagingService;
  reviews: ReviewsService;
  reports: ReportsService;
  notifications: NotificationsService;
  users: UsersService;
  geo: GeoService;
  rates: RatesService;
  catalogs: CatalogsService;
  searchHistory: SearchHistoryService;
  listingCopilot: ListingCopilotService;
  searchIntent: SearchIntentService;
  moderation: ModerationService;
};

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
    db: Database;
    redis: RedisClient;
    storage: ObjectStorage;
    events: HybridEventBus;
    services: AppServices;
    chatHub: ChatHub;
  }
}

type Container = {
  config: AppConfig;
  db: Database;
  redis: RedisClient;
  storage: ObjectStorage;
  events: HybridEventBus;
};

const containerPlugin: FastifyPluginAsync<Container> = async (app, opts) => {
  const geo = new GeoService(new CitiesRepository(opts.db));
  const rates = new RatesService(opts.config, opts.redis);
  const catalogs = new CatalogsService(new CatalogsRepository(opts.db));
  const searchHistory = new SearchHistoryService(new SearchHistoryRepository(opts.db));
  const authRepo = new AuthRepository(opts.db);
  const emailSender = createEmailSender(opts.config, (payload, message) => {
    app.log.info(payload, message);
  });
  const auth = new AuthService(authRepo, opts.config, opts.events, geo, emailSender);
  const listingsRepo = new ListingsRepository(opts.db);
  const aiLogger = new AiCallLogger(app.log);
  const aiUsageLimiter = new AiUsageLimiter(opts.redis, opts.config.AI_COPILOT_DAILY_LIMIT);
  const openRouter = new OpenRouterClient(opts.config);
  const listingCopilotRepo = new ListingCopilotRepository(opts.db);
  const listingCopilot = new ListingCopilotService(
    listingCopilotRepo,
    openRouter,
    opts.config,
    opts.storage,
    aiUsageLimiter,
    aiLogger,
  );
  const listings = new ListingsService(listingsRepo, opts.events, geo, listingCopilot);
  const favoritesRepo = new FavoritesRepository(opts.db);
  const favorites = new FavoritesService(favoritesRepo, opts.db, rates);
  const chatHub = new ChatHub();
  const messagingRepo = new MessagingRepository(opts.db);
  const messaging = new MessagingService(messagingRepo, opts.events, chatHub);
  const reviewsRepo = new ReviewsRepository(opts.db);
  const reviews = new ReviewsService(reviewsRepo, opts.events);
  const reportsRepo = new ReportsRepository(opts.db);
  const reports = new ReportsService(reportsRepo, opts.events);
  const notificationsRepo = new NotificationsRepository(opts.db);
  const notifications = new NotificationsService(notificationsRepo);
  registerNotificationHandlers(opts.events, notifications);
  const usersRepo = new UsersRepository(opts.db);
  const users = new UsersService(usersRepo, opts.events);
  const searchIntent = new SearchIntentService(
    listingCopilotRepo,
    openRouter,
    opts.config,
    aiLogger,
  );
  const moderation = new ModerationService(new ModerationRepository(opts.db), opts.events);

  app.decorate('config', opts.config);
  app.decorate('db', opts.db);
  app.decorate('redis', opts.redis);
  app.decorate('storage', opts.storage);
  app.decorate('events', opts.events);
  app.decorate('chatHub', chatHub);
  app.decorate('services', {
    auth,
    listings,
    favorites,
    messaging,
    reviews,
    reports,
    notifications,
    users,
    geo,
    rates,
    catalogs,
    searchHistory,
    listingCopilot,
    searchIntent,
    moderation,
  });
};

export const registerContainer = fp(containerPlugin);
