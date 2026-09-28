# template-oss

Template for open-source TypeScript projects: a pnpm + Turborepo monorepo with a publishable
package, an Astro Starlight docs site, and a CI pipeline that spends free public-repo minutes on
breadth.

## What is in it

| Piece              | Details                                                                                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/example` | Publishable ESM package built with tsdown; publint + attw + a pack smoke test                                                                                                                                                                  |
| Shared config      | Root dev dependencies from [rxova/shared](https://github.com/rxova/shared): `@rxova/repo-config` (presets + the `rxova-repo-config` bin), `@rxova/ts-utils`, `@rxova/docs-kit`                                                                 |
| `apps/docs`        | Astro Starlight, links validator, sitemap, `.md` twins + `llms.txt` via `@rxova/docs-kit`, deployed to GitHub Pages                                                                                                                            |
| Quality            | TypeScript 6 strict, ESLint 10 + typescript-eslint (strict, type-checked), Prettier, Vitest 5 (95%/file), knip (unused files/exports/deps), sherif (one version per dep)                                                                       |
| Hooks              | Husky: lint-staged + typecheck + tests on commit, commitlint, `verify` on push                                                                                                                                                                 |
| Releases           | Changesets → version PR → npm with trusted publishing and provenance                                                                                                                                                                           |
| CI                 | rxova/shared reusable workflows and actions; tests on Node 22/24 × Linux/macOS/Windows; CodeQL; Codecov; one `all checks` gate                                                                                                                 |
| Renovate           | The rxova/shared org preset: one weekly PR for every patch/minor, auto-merged once `all checks` passes; majors wait for approval on the Dependency Dashboard; lockfile refreshed monthly; labelled `skip-changeset` (`.github/renovate.json5`) |

## After creating a repository from this template

```sh
pnpm install && pnpm exec rxova-repo-config init
```

`init` renames the template to your repository everywhere, turns `packages/example` into
`packages/<repo>`, copies the template's labels and turns GitHub Pages on (`--dry-run` shows the
plan first). Branch rules come from the organisation's rulesets. Then:

1. `pnpm install`, review `git diff`, and commit.
2. **npm:** publish the first version by hand (`npm publish --access public` in the package), add a
   trusted publisher on npmjs.com (repository `<owner>/<repo>`, workflow `release.yml`), then set the
   repository variable `RELEASE_ENABLED` to `true`. Releases stay off until you do.
3. Optional: a `CODECOV_TOKEN` secret for coverage comments.

## Commands

```sh
pnpm install        # dependencies and git hooks
pnpm test           # unit tests, coverage enforced per file
pnpm docs           # docs dev server
pnpm run verify     # everything CI runs, in order
pnpm changeset      # record a change to a published package
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the rest.
