import { InProcessEventBus } from './event-bus.js';

describe('InProcessEventBus', () => {
  it('delivers events to subscribers', async () => {
    const bus = new InProcessEventBus();
    const seen: unknown[] = [];
    bus.subscribe('UserRegistered', async (event) => {
      seen.push(event.payload);
    });
    await bus.publish('UserRegistered', { userId: 'u1' });
    expect(seen).toEqual([{ userId: 'u1' }]);
  });
});
