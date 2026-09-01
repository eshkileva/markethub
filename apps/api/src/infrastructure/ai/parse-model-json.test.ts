import { describe, expect, it } from 'vitest';
import { parseModelJson } from './parse-model-json.js';

describe('parseModelJson', () => {
  it('parses plain JSON', () => {
    expect(parseModelJson('{"title":"Phone"}')).toEqual({ title: 'Phone' });
  });

  it('parses JSON inside markdown fences', () => {
    expect(parseModelJson('Here you go:\n```json\n{"title":"Phone"}\n```')).toEqual({
      title: 'Phone',
    });
  });

  it('extracts JSON object from surrounding prose', () => {
    expect(
      parseModelJson('Sure! {"title":"Phone","description":"Good condition phone"} Thanks.'),
    ).toEqual({
      title: 'Phone',
      description: 'Good condition phone',
    });
  });
});
