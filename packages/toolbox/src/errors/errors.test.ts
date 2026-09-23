import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { errorMessage, isError } from './errors.js';

describe('isError', () => {
  it('accepts an Error and its subclasses', () => {
    expect(isError(new Error('x'))).toBe(true);
    expect(isError(new TypeError('x'))).toBe(true);
  });

  it('accepts an Error from another realm', () => {
    const foreign: unknown = runInNewContext('new Error("x")');
    expect(foreign instanceof Error).toBe(false);
    expect(isError(foreign)).toBe(true);
  });

  it.each([{ message: 'x' }, 'x', null, undefined, 1])('rejects %j', (value) => {
    expect(isError(value)).toBe(false);
  });
});

describe('errorMessage', () => {
  it('reads an error message', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('keeps a thrown string as it is', () => {
    expect(errorMessage('boom')).toBe('boom');
  });

  it('stringifies anything else', () => {
    expect(errorMessage(42)).toBe('42');
    expect(errorMessage(undefined)).toBe('undefined');
  });

  it('is empty for an error whose message getter throws', () => {
    const error = new Error('x');
    Object.defineProperty(error, 'message', {
      get() {
        throw new Error('getter');
      },
    });
    expect(errorMessage(error)).toBe('');
  });

  it('falls back to the tag when String() throws', () => {
    expect(errorMessage(Object.create(null))).toBe('[object Object]');
  });

  it('falls back to a fixed text when even the tag is refused', () => {
    const { proxy, revoke } = Proxy.revocable({}, {});
    revoke();
    expect(errorMessage(proxy)).toBe('Unknown error');
  });
});
