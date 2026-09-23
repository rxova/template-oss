import { describe, expect, it } from 'vitest';
import { baseVitestConfig, COVERAGE_THRESHOLDS } from './vitest-preset.js';

describe('baseVitestConfig', () => {
  it('holds every file to the shared thresholds', () => {
    const coverage = baseVitestConfig().test?.coverage;
    expect(coverage).toMatchObject({ provider: 'v8', thresholds: COVERAGE_THRESHOLDS });
    expect(COVERAGE_THRESHOLDS).toEqual({
      perFile: true,
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
    });
  });

  it('defaults to Node, colocated tests and the log plus lcov reporters', () => {
    const { test } = baseVitestConfig();
    expect(test?.environment).toBe('node');
    expect(test?.include).toEqual(['src/**/*.test.ts', 'src/**/*.test.tsx']);
    expect(test?.coverage).toMatchObject({ reporter: ['text', 'lcov'] });
  });

  it('keeps barrels, types, tests and fixtures out of coverage, plus any extra', () => {
    const { test } = baseVitestConfig({ exclude: ['src/generated.ts'] });
    expect(test?.coverage).toMatchObject({
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.fixtures.{ts,tsx}',
        'src/**/*.types.ts',
        'src/index.ts',
        'src/generated.ts',
      ],
    });
  });

  it('takes the environment, discovery globs and reporters from the package', () => {
    const { test } = baseVitestConfig({
      environment: 'jsdom',
      include: ['test/**/*.ts'],
      reporter: ['json-summary'],
    });
    expect(test?.environment).toBe('jsdom');
    expect(test?.include).toEqual(['test/**/*.ts']);
    expect(test?.coverage).toMatchObject({ reporter: ['json-summary'] });
  });
});
