# @rxova/tooling

Repository maintenance for rxova monorepos. It provides:

- the `rxova-tooling` scripts that CI and the git hooks run;
- the presets that build, test, lint and commitlint read.

One dev dependency replaces a copy of each script in every repository.

```sh
pnpm add -D @rxova/tooling
```

## Commands

Run each command from the repository root, except `pack-smoke`, which runs from a package directory.

| Command                                             | What it does                                                                                                                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rxova-tooling verify [--only a,b]`                 | Runs the pre-push gate in order and stops at the first failure. The steps come from `package.json#tooling.verify.steps`, or a default pnpm and Turborepo list.                                     |
| `rxova-tooling check-changeset`                     | Fails when a published package changed and no changeset was added. Reads `BASE_SHA` and `HEAD_SHA`. `PR_LABELS` or `PR_TITLE` can carry `skip-changeset`.                                          |
| `rxova-tooling check-scope`                         | Writes `code-changed=false` to `GITHUB_OUTPUT` for a release commit, which contains only version and changelog edits.                                                                              |
| `rxova-tooling node-floor`                          | Writes to `GITHUB_OUTPUT` the single `engines.node` floor that all published packages share.                                                                                                       |
| `rxova-tooling pack-smoke [dir]`                    | Packs the package, installs it in a scratch project, then imports and requires it. It also runs every bin with `--version` and checks the shipped files. `workspace:` dependencies are packed too. |
| `rxova-tooling check-llms [root]`                   | Checks each published `llms.txt`: its title, summary and sections, that it appears in `files`, and that its `## API` table matches `src/index.ts` in both directions. Needs `typescript`.          |
| `rxova-tooling write-page-bundle <dist> <p> <base>` | Writes `rxova-page-bundle.json` into a docs dist, for the rxova.org aggregator.                                                                                                                    |

Published packages are the directories under `packages/` whose manifest is not `private`. Nothing
needs to be listed by hand.

## Configuration

Everything is optional. Settings go in the root `package.json`:

```json
{
  "tooling": {
    "verify": {
      "steps": [
        { "name": "lint", "command": "pnpm lint" },
        { "name": "unit tests", "command": "pnpm exec turbo run test" }
      ]
    },
    "changeset": { "singlePackage": true }
  }
}
```

`singlePackage` requires each changeset to name exactly one package. An unknown key is an error,
not a silent default.

## Presets

| Import                      | Use                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| `@rxova/tooling/tsdown`     | `baseBuildConfig(overrides)`: ESM, Node 22, `.js`/`.d.ts`, types, clean.                           |
| `@rxova/tooling/vitest`     | `baseVitestConfig({ environment, include, exclude, reporter })`: 95% per-file coverage thresholds. |
| `@rxova/tooling/eslint`     | `baseEslintConfig({ tsconfigRootDir, consoleAllowed, ignores }, ...extra)`: `strictTypeChecked`.   |
| `@rxova/tooling/commitlint` | Conventional Commits with no length limits, plus `rename`.                                         |
| `@rxova/tooling/prettier`   | `singleQuote`, `printWidth: 100`.                                                                  |

```js
// eslint.config.js
import { baseEslintConfig } from '@rxova/tooling/eslint';
export default baseEslintConfig({ tsconfigRootDir: import.meta.dirname });

// commitlint.config.js
export { default } from '@rxova/tooling/commitlint';
```

```json
// .prettierrc
"@rxova/tooling/prettier"
```

The eslint and commitlint presets ship as plain JavaScript. Hooks load them before anything is
built. Their tools are optional peer dependencies: install the ones you use.

## License

MIT
