import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDevWarner } from './dev-warner.js';

const setup = (enabled = true) => {
  const sink = vi.fn();
  const warner = createDevWarner({
    prefix: 'pkg',
    docsUrl: 'https://example.com/errors',
    enabled: () => enabled,
    sink,
  });
  return { sink, warner };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('format', () => {
  it('prefixes a plain message', () => {
    expect(setup().warner.format('careful')).toBe('[pkg] careful');
  });

  it('adds the code and a link to it', () => {
    expect(setup().warner.format('careful', 'PK1001')).toBe(
      '[pkg] PK1001: careful\n  → https://example.com/errors#pk1001',
    );
  });

  it('leaves the link out without a docs URL', () => {
    const warner = createDevWarner({ prefix: 'pkg' });
    expect(warner.format('careful', 'PK1001')).toBe('[pkg] PK1001: careful');
  });
});

describe('warn', () => {
  it('logs the line alone when there is no detail', () => {
    const { sink, warner } = setup();
    warner.warn('careful');
    expect(sink).toHaveBeenCalledWith('[pkg] careful');
  });

  it('passes detail as its own argument behind a constant format string', () => {
    const { sink, warner } = setup();
    const detail = { id: 1 };
    warner.warn('100% sure', { code: 'PK1', detail });
    expect(sink).toHaveBeenCalledWith(
      '%s',
      '[pkg] PK1: 100% sure\n  → https://example.com/errors#pk1',
      detail,
    );
  });

  it('logs every time', () => {
    const { sink, warner } = setup();
    warner.warn('again');
    warner.warn('again');
    expect(sink).toHaveBeenCalledTimes(2);
  });

  it('stays silent when disabled', () => {
    const { sink, warner } = setup(false);
    warner.warn('careful');
    expect(sink).not.toHaveBeenCalled();
  });
});

describe('warnOnce', () => {
  it('logs a key once until reset', () => {
    const { sink, warner } = setup();
    warner.warnOnce('k', 'first');
    warner.warnOnce('k', 'second');
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledWith('[pkg] first');

    warner.reset();
    warner.warnOnce('k', 'third');
    expect(sink).toHaveBeenLastCalledWith('[pkg] third');
  });

  it('does not spend the key while disabled', () => {
    let enabled = false;
    const sink = vi.fn();
    const warner = createDevWarner({ prefix: 'pkg', enabled: () => enabled, sink });
    warner.warnOnce('k', 'hidden');
    enabled = true;
    warner.warnOnce('k', 'shown');
    expect(sink).toHaveBeenCalledExactlyOnceWith('[pkg] shown');
  });
});

describe('defaults', () => {
  it('writes to console.warn in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    createDevWarner({ prefix: 'pkg' }).warn('careful');
    expect(warn).toHaveBeenCalledWith('[pkg] careful');
  });

  it('is silent in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    createDevWarner({ prefix: 'pkg' }).warn('careful');
    expect(warn).not.toHaveBeenCalled();
  });
});
