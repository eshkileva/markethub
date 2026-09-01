import { describe, expect, it } from 'vitest';
import { buyerQuestionsForCategory } from './buyer-checklists.js';

describe('buyerQuestionsForCategory', () => {
  it('returns product-specific questions for smartphones', () => {
    const questions = buyerQuestionsForCategory('smartphones');
    expect(questions[0]).toContain('iCloud');
    expect(questions.some((q) => q.includes('батаре'))).toBe(true);
  });

  it('falls back to parent category questions', () => {
    const questions = buyerQuestionsForCategory('decor', 'home-garden');
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0]).toMatch(/^Здравствуйте!/);
  });

  it('uses generic purchase questions for unknown categories', () => {
    const questions = buyerQuestionsForCategory('unknown-slug');
    expect(questions).toContain('Есть дефекты, которых нет в описании или на фото?');
    expect(questions.some((q) => q.includes('предоплат'))).toBe(false);
  });
});
