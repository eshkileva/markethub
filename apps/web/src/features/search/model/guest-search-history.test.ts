import { beforeEach, describe, expect, it } from 'vitest';
import { useGuestSearchHistoryStore } from './guest-search-history';

describe('guest search history', () => {
  beforeEach(() => {
    localStorage.clear();
    useGuestSearchHistoryStore.setState({ items: [] });
  });

  it('records normalized queries with dedupe and cap', () => {
    const { record } = useGuestSearchHistoryStore.getState();
    record('  iPhone  ');
    record('iphone');
    record('MacBook');

    const items = useGuestSearchHistoryStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0]?.query).toBe('MacBook');
    expect(items[1]?.query).toBe('iphone');
  });

  it('removes one entry and clears all', () => {
    const store = useGuestSearchHistoryStore.getState();
    store.record('aa');
    store.record('bb');
    const older = useGuestSearchHistoryStore.getState().items.find((item) => item.query === 'aa');
    expect(older?.id).toBeDefined();
    useGuestSearchHistoryStore.getState().remove(older!.id);
    expect(useGuestSearchHistoryStore.getState().items).toHaveLength(1);
    useGuestSearchHistoryStore.getState().clear();
    expect(useGuestSearchHistoryStore.getState().items).toHaveLength(0);
  });
});
