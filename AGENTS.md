# Agent guide

pnpm + Turborepo monorepo. Node >= 22.13. TypeScript everywhere, ESM only.

## Layout

- `packages/*` — published npm packages (each one needs a changeset when it changes).
- `packages/tooling` — `@rxova/tooling`: the repo scripts behind the `rxova-tooling` bin (verify,
  changeset gate, release-commit scope, Node floor, pack smoke, llms.txt check, page bundle) and the
  shared tsdown, vitest, eslint, commitlint and prettier presets. Coverage thresholds live in its
  vitest preset only. This repository runs the scripts from source with `tsx`.
- `packages/toolbox` — `@rxova/toolbox`: small dependency-free runtime helpers, plus a `/react`
  entry. Neutral platform, es2020, no side effects: consumers inline it at build time.
- `packages/tooling/presets/*.js` — plain JavaScript on purpose: ESLint and the commit-msg hook load
  them before anything is built.
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
- Coverage is 95% per file; raise thresholds, never lower them.
- Never skip, delete or weaken a test to make a change pass.
- ESLint runs `strictTypeChecked`. Fix the finding rather than disabling the rule; if a disable is
  truly needed, scope it to one line and say why.
- Conventional Commits; subject line only. Never `--no-verify`.
- No new runtime dependency in a published package without saying why. `@rxova/toolbox` takes none
  at all, and `@rxova/tooling` keeps its tools as optional peer dependencies.
