/**
 * A change to a published package needs a changeset, or the release goes out
 * with an empty changelog and an unchanged version.
 *
 * A published package is a directory under `packages/` whose manifest is not
 * private, read from the manifests rather than listed, so a new package is
 * covered the moment it exists. Docs, CI config, the apps and the private
 * packages reach no one who installs, so none of those ask for a changeset.
 *
 * With `tooling.changeset.singlePackage` set in the root `package.json`, each
 * changeset must also name exactly one package, so every changelog entry
 * belongs to the package it describes.
 *
 * Run from the repository root with `BASE_SHA` and `HEAD_SHA` set. `PR_LABELS`
 * (comma-separated) and `PR_TITLE` carry the escape hatch.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readConfig, readFile } from '../config/config.js';
import type { Reader } from '../config/config.types.js';
import { isEntry } from '../entry/entry.js';
import type { Differ, Manifest, Request, Verdict } from './check-changeset.types.js';

export const gitDiff: Differ = (base, head, { existing = false } = {}) =>
  execFileSync(
    'git',
    ['diff', '--name-only', ...(existing ? ['--diff-filter=d'] : []), `${base}...${head}`],
    { encoding: 'utf8' },
  )
    .split('\n')
    .filter(Boolean);

/** The directory names under `packages/` whose manifest is not private. */
export const publishedDirs = (root: string): string[] => {
  const packages = join(root, 'packages');
  if (!existsSync(packages)) return [];
  return readdirSync(packages).filter((dir) => {
    const manifest = join(packages, dir, 'package.json');
    if (!existsSync(manifest)) return false;
    return (JSON.parse(readFileSync(manifest, 'utf8')) as Manifest).private !== true;
  });
};

/** Test code in any of the layouts the repositories use: none of it is packed. */
const isTestFile = (file: string): boolean =>
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(file) ||
  file.includes('/__tests__/') ||
  file.includes('/__fixtures__/') ||
  file.includes('/e2e/');

/**
 * Whether the diff touches something a published package ships. Markdown and
 * tests inside a package are excluded: neither reaches the tarball, so neither
 * needs a changelog entry. `published` holds directory names.
 */
export const touchesPackage = (changed: string[], published: string[]): boolean =>
  changed.some(
    (file) =>
      published.some((dir) => file.startsWith(`packages/${dir}/`)) &&
      !file.endsWith('.md') &&
      !isTestFile(file),
  );

export const changesetFiles = (changed: string[]): string[] =>
  changed.filter(
    (file) => file.startsWith('.changeset/') && file.endsWith('.md') && !file.endsWith('README.md'),
  );

export const hasChangeset = (changed: string[]): boolean => changesetFiles(changed).length > 0;

/**
 * How many packages a changeset's frontmatter names. Both quote styles count:
 * `changeset add` writes double quotes, and Prettier with `singleQuote` rewrites
 * them, after which a double-quote-only pattern counts zero.
 */
export const packagesNamed = (markdown: string): number => {
  const frontmatter = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(markdown)?.[1];
  if (frontmatter === undefined) return 0;
  return frontmatter
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^("[^"]+"|'[^']+')\s*:\s*(patch|minor|major)(?:\s+#.*)?$/.test(line)).length;
};

/** One line per changeset that does not name exactly one package. */
export const singlePackageProblems = (files: string[], read: Reader): string[] =>
  files.flatMap((file) => {
    const body = read(file);
    if (body === undefined) return [`  ${file}: could not be read`];
    const count = packagesNamed(body);
    return count === 1 ? [] : [`  ${file}: names ${String(count)} packages, expected 1`];
  });

/**
 * The label that says this pull request needs no changelog entry.
 *
 * A dependency bump changes what the repository builds *with* and nothing about
 * what it publishes, so the gate has nothing to ask for — and a gate that asks
 * anyway teaches people to write empty changesets. Renovate applies this
 * label to every pull request it opens. `[skip-changeset]` in the title does
 * the same for a pull request whose author cannot set labels.
 */
export const SKIP_LABEL = 'skip-changeset';

/** The workflow hands labels over as one comma-separated string, or not at all. */
export const labelsOf = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean);

const skipReason = ({ labels = [], title = '' }: Request): string | undefined => {
  if (labels.includes(SKIP_LABEL)) return `\`${SKIP_LABEL}\` set on this pull request`;
  if (title.includes(`[${SKIP_LABEL}]`)) return `\`[${SKIP_LABEL}]\` in the pull request title`;
  return undefined;
};

/**
 * `changed` is every path the range touched; `present` leaves out the deleted
 * ones, and defaults to `changed` for callers that have no deletions to tell
 * apart.
 */
export const check = (
  changed: string[],
  published: string[],
  request: Request = {},
  { present = changed }: { present?: string[] } = {},
): Verdict => {
  if (!touchesPackage(changed, published)) {
    return { exitCode: 0, message: 'check-changeset: no publishable change, nothing to require' };
  }
  const skip = skipReason(request);
  if (skip !== undefined) return { exitCode: 0, message: `check-changeset: ${skip}` };
  if (hasChangeset(present)) {
    return { exitCode: 0, message: 'check-changeset: changeset present' };
  }
  return {
    exitCode: 1,
    message: [
      'check-changeset: this PR changes a published package but adds no changeset.',
      '',
      'Run `pnpm changeset` and commit the file it writes.',
      `If it publishes nothing — a dependency bump, say — label it \`${SKIP_LABEL}\`.`,
    ].join('\n'),
  };
};

/** Returns the process exit code rather than taking it, so tests can call it. */
export const main = (
  env: NodeJS.ProcessEnv = process.env,
  {
    root = process.cwd(),
    diff = gitDiff,
    read = readFile,
    published,
  }: { root?: string; diff?: Differ; read?: Reader; published?: string[] } = {},
): number => {
  const base = env.BASE_SHA;
  const head = env.HEAD_SHA;

  if (!base || !head) {
    console.error('check-changeset: BASE_SHA and HEAD_SHA must be set');
    return 1;
  }

  try {
    const config = readConfig(root, read);
    const present = diff(base, head, { existing: true });
    const verdict = check(
      diff(base, head),
      published ?? publishedDirs(root),
      { labels: labelsOf(env.PR_LABELS), title: env.PR_TITLE ?? '' },
      { present },
    );

    if (verdict.exitCode === 0 && config.changeset?.singlePackage === true) {
      const problems = singlePackageProblems(
        changesetFiles(present).map((file) => join(root, file)),
        read,
      );
      if (problems.length > 0) {
        console.error(
          ['check-changeset: each changeset must name exactly one package.', ...problems].join(
            '\n',
          ),
        );
        return 1;
      }
    }

    if (verdict.exitCode === 0) console.log(verdict.message);
    else console.error(verdict.message);
    return verdict.exitCode;
  } catch (failure) {
    console.error(`check-changeset failed — ${(failure as Error).message}`);
    return 1;
  }
};

/* v8 ignore start -- the entry shell; covered by the test that spawns this
   file, which reports no coverage back into this run. */
if (isEntry(import.meta.url)) {
  process.exit(main());
}
/* v8 ignore stop */
