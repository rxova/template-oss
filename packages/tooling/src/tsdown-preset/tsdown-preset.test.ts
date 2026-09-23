import { describe, expect, it } from 'vitest';
import { baseBuildConfig } from './tsdown-preset.js';

describe('baseBuildConfig', () => {
  it('builds ESM for Node, with types, from src/index.ts', () => {
    expect(baseBuildConfig()).toEqual({
      entry: { index: 'src/index.ts' },
      format: ['esm'],
      platform: 'node',
      target: 'node22',
      fixedExtension: false,
      dts: true,
      clean: true,
    });
  });

  it('lets a package override a field and keeps the rest', () => {
    const config = baseBuildConfig({ platform: 'neutral', target: 'es2020' });
    expect(config.platform).toBe('neutral');
    expect(config.target).toBe('es2020');
    expect(config.format).toEqual(['esm']);
  });
});
