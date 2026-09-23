/**
 * Freezes a value and everything reachable from it, and returns it.
 *
 * Typed arrays and DataViews are left alone, because freezing a non-empty one
 * throws. A Map or Set cannot have its entries locked — `map.set()` still works
 * after `Object.freeze` — but the keys and values it holds are frozen. The value
 * is frozen before its children, so a reference cycle ends at the `isFrozen`
 * check instead of looping.
 */
export const deepFreeze = <T>(value: T): T => {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  if (ArrayBuffer.isView(value)) return value;

  Object.freeze(value);
  if (value instanceof Map) {
    for (const [key, entry] of value) {
      deepFreeze(key);
      deepFreeze(entry);
    }
  } else if (value instanceof Set) {
    for (const entry of value) deepFreeze(entry);
  } else {
    for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
};
