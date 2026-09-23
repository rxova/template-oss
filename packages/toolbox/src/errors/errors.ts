/**
 * The two questions every `catch (error: unknown)` asks.
 */
import { isInstanceOf, objectTag, readString } from '../safe/safe.js';
import { isObjectLike } from '../predicates/predicates.js';

/**
 * A real `Error`, from this realm or another. An object that merely has a
 * `message` is not one: that looser shape is a policy some callers want and
 * others must not have, so it stays with them.
 */
export const isError = (value: unknown): value is Error =>
  isInstanceOf(value, Error) || (isObjectLike(value) && objectTag(value) === '[object Error]');

/**
 * The message to show for anything thrown. An `Error` gives its `message`, a
 * string is its own message, and anything else goes through `String()`, which
 * can itself throw — a null-prototype object has no `toString` — so that falls
 * back to the object's tag rather than escaping the handler it runs in.
 */
export const errorMessage = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (isError(value)) return readString(value, 'message') ?? '';
  try {
    return String(value);
  } catch {
    return objectTag(value) ?? 'Unknown error';
  }
};
