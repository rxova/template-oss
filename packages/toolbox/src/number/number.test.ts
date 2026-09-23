import { describe, expect, it } from 'vitest';
import { clamp } from './number.js';

describe('clamp', () => {
  it.each([
    [5, 0, 10, 5],
    [-1, 0, 10, 0],
    [11, 0, 10, 10],
    [3, 3, 3, 3],
  ])('clamps %d into [%d, %d] as %d', (value, min, max, expected) => {
    expect(clamp(value, min, max)).toBe(expected);
  });

  it('keeps NaN visible', () => {
    expect(clamp(NaN, 0, 1)).toBeNaN();
  });

  it('throws on a reversed range', () => {
    expect(() => clamp(1, 2, 0)).toThrow(RangeError);
  });
});
