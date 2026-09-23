import { afterEach, describe, expect, it, vi } from 'vitest';
import { canUseDOM } from './dom.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('canUseDOM', () => {
  it('is false in Node', () => {
    expect(canUseDOM()).toBe(false);
  });

  it('is true with a window and a document', () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', {});
    expect(canUseDOM()).toBe(true);
  });

  it('is false with a window but no document', () => {
    vi.stubGlobal('window', {});
    expect(canUseDOM()).toBe(false);
  });
});
