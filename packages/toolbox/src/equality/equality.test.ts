import { describe, expect, it } from 'vitest';
import { shallowEqual } from './equality.js';

describe('shallowEqual', () => {
  it.each([
    [1, 1],
    [NaN, NaN],
    ['a', 'a'],
    [null, null],
    [
      { a: 1, b: 'x' },
      { b: 'x', a: 1 },
    ],
    [
      [1, 2],
      [1, 2],
    ],
    [{}, {}],
  ])('treats %j and %j as equal', (a, b) => {
    expect(shallowEqual(a, b)).toBe(true);
  });

  it('is true for the same reference', () => {
    const value = { a: {} };
    expect(shallowEqual(value, value)).toBe(true);
  });

  it.each([
    [1, 2],
    [0, -0],
    [null, {}],
    [{}, null],
    [1, {}],
    [{ a: 1 }, { a: 2 }],
    [{ a: 1 }, { a: 1, b: 2 }],
    [[1], [1, 2]],
    [{ 0: 1 }, [1]],
    [{ a: {} }, { a: {} }],
  ])('treats %j and %j as different', (a, b) => {
    expect(shallowEqual(a, b)).toBe(false);
  });

  it('does not call { a: undefined } and { b: undefined } equal', () => {
    expect(shallowEqual({ a: undefined }, { b: undefined })).toBe(false);
  });
});
