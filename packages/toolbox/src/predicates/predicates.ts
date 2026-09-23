/**
 * Narrowing for values that arrive untyped: parsed JSON, a `postMessage`
 * payload, a caught `unknown`.
 *
 * The three answer different questions on purpose, and the names say which.
 * "Is it an object" meant arrays-in in some copies and arrays-out in others,
 * which is how the same name ends up meaning opposite things.
 */

/**
 * Any non-null object: arrays, class instances and null-prototype bags
 * included. The `typeof value === 'object' && value !== null` check, named.
 * Safe to read a property off, nothing more.
 */
export const isObjectLike = (value: unknown): value is object =>
  typeof value === 'object' && value !== null;

/**
 * A non-null, non-array object, indexable by string key. Class instances pass;
 * reach for {@link isPlainObject} when a `Date` or a `Map` must not.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  isObjectLike(value) && !Array.isArray(value);

/**
 * A plain data object: an object literal, a `JSON.parse` result, or an
 * `Object.create(null)` bag. Arrays and class instances are rejected, because
 * key-wise iteration silently mangles them.
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
