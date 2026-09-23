import { useEffect, useLayoutEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('useIsomorphicLayoutEffect', () => {
  it('is useEffect without a document', async () => {
    const { useIsomorphicLayoutEffect } = await import('./layout-effect.js');
    expect(useIsomorphicLayoutEffect).toBe(useEffect);
  });

  it('is useLayoutEffect with a document', async () => {
    vi.stubGlobal('document', {});
    const { useIsomorphicLayoutEffect } = await import('./layout-effect.js');
    expect(useIsomorphicLayoutEffect).toBe(useLayoutEffect);
  });
});
