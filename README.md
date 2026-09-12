# template-oss

Template for open-source TypeScript projects: a pnpm + Turborepo monorepo with a publishable
package, an Astro Starlight docs site, and a CI pipeline that spends free public-repo minutes on
breadth.

## What is in it

| Piece              | Details                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/example` | Publishable ESM package built with tsdown; publint + attw + a pack smoke test                                                                          |
| `packages/tooling` | `verify` (the pre-push gate), changeset gate, release-commit detection, pack smoke                                                                     |
| `apps/docs`        | Astro Starlight, links validator, sitemap, deployed to GitHub Pages                                                                                    |
| Quality            | TypeScript 6 strict, ESLint 10 + typescript-eslint, Prettier, Vitest 5 (95%/file)                                                                      |
| Hooks              | Husky: lint-staged + typecheck + tests on commit, commitlint, `verify` on push                                                                         |
| Agent hooks        | Claude Code Stop hooks for overlock, saidso and basting (`.claude/`)                                                                                   |
| Releases           | Changesets → version PR → npm with trusted publishing and provenance                                                                                   |
| CI                 | Parallel jobs; tests on Node 22/24 × Linux/macOS/Windows; CodeQL; Codecov; overlock on every PR; one `all checks` gate                                 |
| Dependabot         | Weekly, one grouped PR per ecosystem, labelled `skip-changeset`; patch/minor updates auto-merge once `all checks` passes (`dependabot-auto-merge.yml`) |

## After creating a repository from this template

1. Replace the template's name everywhere, and rename the example package:
   ```sh
   grep -rl template-oss --exclude-dir=node_modules --exclude-dir=.git . | xargs sed -i '' 's/template-oss/<repo>/g'
   git mv packages/example packages/<name>   # then update "name" and "repository.directory"
   ```
2. `pnpm install`
3. Create the labels Dependabot and the changeset gate use (templates do not copy labels):
   ```sh
   gh label create dependencies --color 0366d6 && gh label create skip-changeset --color ededed
   ```
4. **Docs:** Settings → Pages → Source: **GitHub Actions**. The Docs workflow skips itself until
   then.
5. **npm:** publish the first version by hand (`npm publish --access public` in the package), add a
   trusted publisher on npmjs.com (repository `rxova/<repo>`, workflow `release.yml`), then set the
   repository variable `RELEASE_ENABLED` to `true`. Releases stay off until you do.
6. **Branch protection** on `main`: require the `all checks` status.
7. Optional: add a `CODECOV_TOKEN` secret for coverage comments.

## Commands

```sh
pnpm install        # dependencies and git hooks
pnpm test           # unit tests, coverage enforced per file
pnpm docs           # docs dev server
pnpm run verify     # everything CI runs, in order
pnpm changeset      # record a change to a published package
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the rest.
