import { afterEach, describe, expect, it, vi } from 'vitest';
import { isDevelopment } from './env.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('isDevelopment', () => {
  it('lets a boolean __DEV__ win over NODE_ENV', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubGlobal('__DEV__', true);
    expect(isDevelopment()).toBe(true);

    vi.stubEnv('NODE_ENV', 'development');
    vi.stubGlobal('__DEV__', false);
    expect(isDevelopment()).toBe(false);
  });

  it('ignores a __DEV__ that is not a boolean', () => {
    vi.stubGlobal('__DEV__', 'yes');
    vi.stubEnv('NODE_ENV', 'production');
    expect(isDevelopment()).toBe(false);
  });

  it.each([
    ['development', true],
    ['test', true],
    ['production', false],
  ])('reads NODE_ENV=%s as %s', (value, expected) => {
    vi.stubEnv('NODE_ENV', value);
    expect(isDevelopment()).toBe(expected);
  });

  it('counts an unset NODE_ENV as development', () => {
    vi.stubEnv('NODE_ENV', undefined);
    expect(isDevelopment()).toBe(true);
  });

  it('is false where there is no process at all, as in an unbundled browser', () => {
    vi.stubGlobal('process', undefined);
    expect(isDevelopment()).toBe(false);
  });
});
