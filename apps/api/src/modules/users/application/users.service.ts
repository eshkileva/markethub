import type { EventBus } from '../../../shared/events/event-bus.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';
import type { UsersRepository } from '../infrastructure/users.repository.js';

function publicProfile(user: {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  country: string;
  city: string | null;
  trustScore: number;
  isVerified: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    country: user.country,
    city: user.city,
    trustScore: user.trustScore,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly events: EventBus,
  ) {}

  async getByUsername(username: string) {
    const user = await this.repo.findByUsername(username);
    if (!user) throw new NotFoundError('User not found');
    return publicProfile(user);
  }

  async setVerified(userId: string, isVerified: boolean) {
    const existing = await this.repo.findById(userId);
    if (!existing) throw new NotFoundError('User not found');
    const user = await this.repo.setVerified(userId, isVerified);
    if (!user) throw new NotFoundError('User not found');
    if (isVerified) {
      await this.events.publish('UserVerified', { userId: user.id, isVerified: true });
    }
    return publicProfile(user);
  }
}
