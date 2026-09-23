import { defineConfig, type ViteUserConfig } from 'vitest/config';
import type { BaseVitestOptions } from './vitest-preset.types.js';

/**
 * The one home of the coverage thresholds.
 *
 * Per file, so one thinly covered module cannot hide behind a well-covered one
 * in the aggregate. Raise them as the suites improve; never lower one to get a
 * build green.
 */
export const COVERAGE_THRESHOLDS = {
  perFile: true,
  statements: 95,
  branches: 95,
  functions: 95,
  lines: 95,
} as const;

/**
 * Each feature lives in `src/<feature>/`: `<feature>.ts`, its tests in
 * `<feature>.test.ts`, its types in `<feature>.types.ts`, and fakes that several
 * suites share in `<feature>.fixtures.ts`, which is test code. `index.ts` is a
 * re-export barrel and a `.types.ts` file is types only; neither has executable
 * lines worth a threshold. Logic that lands in either one is logic the
 * thresholds cannot see, so keep them to re-exports and types.
 */
const BASE_EXCLUSIONS = [
  'src/**/*.test.{ts,tsx}',
  'src/**/*.fixtures.{ts,tsx}',
  'src/**/*.types.ts',
  'src/index.ts',
] as const;

/**
 * A package's Vitest config, from the shared preset. Every `vitest.config.ts`
 * is a one-liner over this, so raising the bar is a single-file change rather
 * than a sweep that misses a package.
 */
export const baseVitestConfig = ({
  environment = 'node',
  include = ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  exclude = [],
  reporter = ['text', 'lcov'],
}: BaseVitestOptions = {}): ViteUserConfig =>
  defineConfig({
    test: {
      environment,
      include: [...include],
      coverage: {
        provider: 'v8',
        reporter: [...reporter],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [...BASE_EXCLUSIONS, ...exclude],
        thresholds: { ...COVERAGE_THRESHOLDS },
      },
    },
  });
