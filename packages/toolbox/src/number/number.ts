/**
 * `value` held within `[min, max]`. NaN stays NaN, so a bad input is visible
 * rather than silently becoming a bound. A range whose ends are reversed is a
 * bug at the call site, so it throws instead of picking one.
 */
export const clamp = (value: number, min: number, max: number): number => {
  if (min > max) throw new RangeError(`clamp: min ${String(min)} is above max ${String(max)}`);
  return Math.min(max, Math.max(min, value));
};
