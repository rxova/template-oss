import type { Linter } from 'eslint';

export interface BaseEslintOptions {
  /** The directory holding the root tsconfig: `import.meta.dirname` in `eslint.config.js`. */
  tsconfigRootDir: string;
  /** Globs where `console` is the output contract. Defaults to `packages/tooling/**`. */
  consoleAllowed?: readonly string[];
  /** Extra global ignores, beside dist, coverage, caches and tool config. */
  ignores?: readonly string[];
}

export declare const baseEslintConfig: (
  options: BaseEslintOptions,
  ...extra: Linter.Config[]
) => Linter.Config[];
