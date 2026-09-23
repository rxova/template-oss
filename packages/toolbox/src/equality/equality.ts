/**
 * `Object.is` for primitives and identical references; otherwise both sides
 * must be objects of the same kind (array or not) holding the same own
 * enumerable keys, each `Object.is`-equal.
 *
 * The own-key check is load-bearing: comparing key counts and values alone
 * calls `{ a: undefined }` and `{ b: undefined }` equal, because both read
 * `undefined` at every key compared.
 */
export const shallowEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length) return false;
  return keys.every((key) => Object.hasOwn(right, key) && Object.is(left[key], right[key]));
};
