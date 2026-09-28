# Agent guide

pnpm + Turborepo monorepo. Node >= 22.13. TypeScript everywhere, ESM only.

## Layout

- `packages/*` — published npm packages (each one needs a changeset when it changes).
- Shared config comes from [rxova/shared](https://github.com/rxova/shared), as root dev
  dependencies: `@rxova/repo-config` (ESLint, Prettier, commitlint, lint-staged, changelog,
  tsconfig, tsdown, Vitest and Knip presets, plus the `rxova-repo-config` bin behind `verify`,
  the changeset gate and pack smoke), `@rxova/ts-utils` and `@rxova/docs-kit`. Change a preset
  there, not here. CI calls the reusable workflows and actions from rxova/shared.
- `apps/docs` — Astro Starlight site, deployed to GitHub Pages.

## Commands

- `pnpm run verify` — the full gate, same order as CI. Run it before saying work is done.
- `pnpm test` / `pnpm typecheck` / `pnpm lint` / `pnpm format` — the pieces.
- `pnpm --filter <package> test` — one package.
- `pnpm changeset` — record a change to a published package.

## Rules

- One folder per feature: `src/<feature>/<feature>.ts` holds the code and no types,
  `<feature>.test.ts` its tests, `<feature>.types.ts` its types, `<feature>.fixtures.ts` the fakes
  its suites share. `src/index.ts` re-exports only and `.types.ts` files hold types only — both are
  excluded from coverage, so logic there is logic nobody measures.
- Coverage is 95% per file (the shared Vitest preset); raise thresholds, never lower them.
- Never skip, delete or weaken a test to make a change pass.
- ESLint runs `strictTypeChecked`. Fix the finding rather than disabling the rule; if a disable is
  truly needed, scope it to one line and say why.
- Conventional Commits; subject line only. Never `--no-verify`.
- No new runtime dependency in a published package without saying why.
