import { describe, expect, it } from 'vitest';
import {
  arrayItems,
  hasProperty,
  isInstanceOf,
  objectTag,
  readProperty,
  readString,
  safeKeys,
  tryRead,
} from './safe.js';

const hostile = (): object => {
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  return proxy;
};

const throwingGetter = Object.defineProperty({}, 'value', {
  get() {
    throw new Error('getter');
  },
});

describe('tryRead', () => {
  it('reports a successful read', () => {
    expect(tryRead({ a: 1 }, 'a')).toEqual({ ok: true, value: 1 });
  });

  it('reports a getter that throws', () => {
    expect(tryRead(throwingGetter, 'value')).toEqual({ ok: false });
  });
});

describe('readProperty', () => {
  it('reads a property', () => {
    expect(readProperty({ a: 1 }, 'a')).toBe(1);
  });

  it('treats a throwing getter as absent', () => {
    expect(readProperty(throwingGetter, 'value')).toBeUndefined();
  });
});

describe('readString', () => {
  it('reads a string', () => {
    expect(readString({ a: 'x' }, 'a')).toBe('x');
  });

  it('treats another type as absent', () => {
    expect(readString({ a: 1 }, 'a')).toBeUndefined();
  });
});

describe('hasProperty', () => {
  it('follows the prototype chain, like `in`', () => {
    expect(hasProperty({}, 'toString')).toBe(true);
    expect(hasProperty({}, 'missing')).toBe(false);
  });

  it('is false when a proxy refuses', () => {
    expect(hasProperty(hostile(), 'a')).toBe(false);
  });
});

describe('safeKeys', () => {
  it('lists own enumerable keys', () => {
    expect(safeKeys({ a: 1, b: 2 })).toEqual(['a', 'b']);
  });

  it('is empty when a proxy refuses', () => {
    expect(safeKeys(hostile())).toEqual([]);
  });
});

describe('isInstanceOf', () => {
  it('narrows an instance', () => {
    expect(isInstanceOf(new Error('x'), Error)).toBe(true);
    expect(isInstanceOf({}, Error)).toBe(false);
  });

  it('is false when Symbol.hasInstance throws', () => {
    class Hostile {
      readonly kind = 'hostile';
      static [Symbol.hasInstance](): boolean {
        throw new Error('hasInstance');
      }
    }
    expect(isInstanceOf({}, Hostile)).toBe(false);
  });
});

describe('objectTag', () => {
  it('reads the tag', () => {
    expect(objectTag(new Map())).toBe('[object Map]');
    expect(objectTag(null)).toBe('[object Null]');
  });

  it('is undefined when the tag getter throws', () => {
    const value = Object.defineProperty({}, Symbol.toStringTag, {
      get() {
        throw new Error('tag');
      },
    });
    expect(objectTag(value)).toBeUndefined();
  });
});

describe('arrayItems', () => {
  it('snapshots an array', () => {
    const source = [1, 2];
    const items = arrayItems(source);
    expect(items).toEqual([1, 2]);
    expect(items).not.toBe(source);
  });

  it('is undefined for anything else', () => {
    expect(arrayItems({ length: 1 })).toBeUndefined();
  });

  it('is undefined when the array is a revoked proxy', () => {
    const { proxy, revoke } = Proxy.revocable<unknown[]>([], {});
    revoke();
    expect(arrayItems(proxy)).toBeUndefined();
  });
});
