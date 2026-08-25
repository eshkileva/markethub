import { categoryRequiresCondition } from './condition.js';

describe('categoryRequiresCondition', () => {
  it('requires condition for goods categories', () => {
    expect(categoryRequiresCondition('phones')).toBe(true);
    expect(categoryRequiresCondition('auto')).toBe(true);
    expect(categoryRequiresCondition(null)).toBe(true);
  });

  it('skips condition for services and jobs', () => {
    expect(categoryRequiresCondition('services')).toBe(false);
    expect(categoryRequiresCondition('jobs')).toBe(false);
  });
});
