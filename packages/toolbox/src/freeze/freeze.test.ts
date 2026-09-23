import { describe, expect, it } from 'vitest';
import { deepFreeze } from './freeze.js';

describe('deepFreeze', () => {
  it('returns primitives untouched', () => {
    expect(deepFreeze(1)).toBe(1);
    expect(deepFreeze(null)).toBeNull();
  });

  it('freezes nested objects and arrays, and returns the same value', () => {
    const value = { a: { b: [1, { c: 2 }] } };
    expect(deepFreeze(value)).toBe(value);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.a)).toBe(true);
    expect(Object.isFrozen(value.a.b)).toBe(true);
    expect(Object.isFrozen(value.a.b[1])).toBe(true);
  });

  it('freezes the keys and values held by a Map and the entries of a Set', () => {
    const key = { k: 1 };
    const entry = { v: 1 };
    const member = { s: 1 };
    deepFreeze({ map: new Map([[key, entry]]), set: new Set([member]) });
    expect(Object.isFrozen(key)).toBe(true);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(member)).toBe(true);
  });

  it('leaves typed arrays alone rather than throwing', () => {
    const bytes = new Uint8Array([1]);
    expect(() => deepFreeze({ bytes })).not.toThrow();
    expect(Object.isFrozen(bytes)).toBe(false);
  });

  it('terminates on a cycle', () => {
    const value: { self?: unknown } = {};
    value.self = value;
    expect(deepFreeze(value)).toBe(value);
    expect(Object.isFrozen(value)).toBe(true);
  });
});
