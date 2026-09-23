/**
 * Reflection that never throws.
 *
 * Code that inspects a value it does not own — an error handler, a serializer,
 * a dev warning — must not replace the problem it is reporting with a new one
 * raised by a getter, a revoked proxy or a custom `Symbol.hasInstance`. Each
 * helper here turns that failure into "absent".
 */
import type { ReadResult } from './safe.types.js';

/** Reads a property, reporting whether the read itself succeeded. */
export const tryRead = (value: object, key: PropertyKey): ReadResult => {
  try {
    return { ok: true, value: Reflect.get(value, key) };
  } catch {
    return { ok: false };
  }
};

/** Reads a property, treating an inaccessible one as absent. */
export const readProperty = (value: object, key: PropertyKey): unknown => tryRead(value, key).value;

/** Reads a string property, treating an inaccessible or differently typed one as absent. */
export const readString = (value: object, key: PropertyKey): string | undefined => {
  const property = readProperty(value, key);
  return typeof property === 'string' ? property : undefined;
};

/** `key in value`, without letting a proxy's `has` trap escape. */
export const hasProperty = (value: object, key: PropertyKey): boolean => {
  try {
    return Reflect.has(value, key);
  } catch {
    return false;
  }
};

/** Enumerable own keys, or none when a proxy refuses inspection. */
export const safeKeys = (value: object): string[] => {
  try {
    return Object.keys(value);
  } catch {
    return [];
  }
};

/** `instanceof`, without letting a proxy or a custom `Symbol.hasInstance` escape. */
export const isInstanceOf = <Instance>(
  value: unknown,
  constructor: abstract new (...args: never[]) => Instance,
): value is Instance => {
  try {
    return value instanceof constructor;
  } catch {
    return false;
  }
};

/**
 * The `[object Tag]` string, which survives realms where `instanceof` does not:
 * a `Map` from an iframe is not `instanceof Map` here, but its tag is still
 * `[object Map]`. Undefined when even that is refused.
 */
export const objectTag = (value: unknown): string | undefined => {
  try {
    return Object.prototype.toString.call(value);
  } catch {
    return undefined;
  }
};

/** A snapshot of an array before walking it, or undefined for anything else. */
export const arrayItems = (value: unknown): unknown[] | undefined => {
  try {
    return Array.isArray(value) ? Array.from(value as readonly unknown[]) : undefined;
  } catch {
    return undefined;
  }
};
