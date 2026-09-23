// @ts-check
// Plain JavaScript on purpose: ESLint and the pre-commit hook load this before
// anything is built, so it cannot come from dist.
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * The shared flat config: `strictTypeChecked` plus `stylisticTypeChecked` over
 * every TypeScript file, no console in shipped code, and the few test-only
 * relaxations where the rule is wrong about tests rather than about the code.
 *
 * @param {import('./eslint.js').BaseEslintOptions} options
 * @param {...import('eslint').Linter.Config} extra Appended last, so they win.
 */
export const baseEslintConfig = (
  { tsconfigRootDir, consoleAllowed = ['packages/tooling/**'], ignores = [] },
  ...extra
) =>
  defineConfig(
    globalIgnores([
      '**/dist/',
      '**/coverage/',
      '**/.turbo/',
      // Astro writes these type declarations on every build.
      '**/.astro/',
      // Local agent state; `.claude/worktrees/` can hold whole checkouts of the repo.
      '**/.claude/',
      // Tool config lives outside the type-checked programs; linting it with
      // projectService would demand a tsconfig per config file.
      '**/*.config.{js,cjs,mjs,ts}',
      ...ignores,
    ]),
    js.configs.recommended,
    {
      files: ['**/*.{ts,tsx}'],
      extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
      languageOptions: {
        globals: { ...globals.node },
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { fixStyle: 'inline-type-imports' },
        ],
        // Libraries ship no console noise. Repo tooling opts out below.
        'no-console': 'error',
      },
    },
    {
      // Repo tooling, where stdout is the output contract rather than a leak.
      files: [...consoleAllowed],
      rules: { 'no-console': 'off' },
    },
    {
      // Tests, and the fakes several suites share.
      files: ['**/*.test.{ts,tsx}', '**/*.fixtures.{ts,tsx}'],
      rules: {
        // A test may assert on a condition the types claim is impossible — that
        // is often the whole point of the test.
        '@typescript-eslint/no-unnecessary-condition': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        // `expect(spy).toHaveBeenCalledWith(…)` reads a method without calling
        // it, the one shape where this rule is always a false positive.
        '@typescript-eslint/unbound-method': 'off',
      },
    },
    {
      files: ['**/*.{js,mjs,cjs}'],
      languageOptions: { globals: { ...globals.node } },
    },
    ...extra,
  );
