import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '**/dist/',
    '**/coverage/',
    '**/.turbo/',
    // Astro writes these type declarations on every build.
    '**/.astro/',
    // Local agent state; `.claude/worktrees/` can hold whole checkouts of this repo.
    '**/.claude/',
    // Tool config lives outside the type-checked programs; linting it with
    // projectService would demand a tsconfig per config file.
    '**/*.config.{js,cjs,mjs,ts}',
  ]),
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      // Libraries ship no console noise. Repo tooling opts out below.
      'no-console': 'error',
    },
  },
  {
    // Repo tooling, where stdout is the output contract rather than a leak.
    files: ['packages/tooling/**'],
    rules: { 'no-console': 'off' },
  },
  {
    // Tests, and the fakes several suites share.
    files: ['**/*.test.ts', '**/*.fixtures.ts'],
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
);
