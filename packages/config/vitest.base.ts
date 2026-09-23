import { defineConfig, type ViteUserConfig } from 'vitest/config';

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
  'src/**/*.test.ts',
  'src/**/*.fixtures.ts',
  'src/**/*.types.ts',
  'src/index.ts',
] as const;

export interface BaseVitestOptions {
  /** Test discovery globs. Defaults to `src/**\/*.test.ts`. */
  readonly include?: readonly string[];
  /** Extra coverage exclusions. Each one needs a reason at its call site. */
  readonly exclude?: readonly string[];
}

/**
 * A package's Vitest config, from the shared preset. Every `vitest.config.ts`
 * is a one-liner over this, so raising the bar is a single-file change rather
 * than a sweep that misses a package.
 */
export const baseVitestConfig = ({
  include = ['src/**/*.test.ts'],
  exclude = [],
}: BaseVitestOptions = {}): ViteUserConfig =>
  defineConfig({
    test: {
      environment: 'node',
      include: [...include],
      coverage: {
        provider: 'v8',
        // `text` for a human reading CI logs, `lcov` for the coverage service.
        reporter: ['text', 'lcov'],
        include: ['src/**/*.ts'],
        exclude: [...BASE_EXCLUSIONS, ...exclude],
        thresholds: { ...COVERAGE_THRESHOLDS },
      },
    },
  });
