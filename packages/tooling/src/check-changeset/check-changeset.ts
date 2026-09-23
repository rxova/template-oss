/**
 * A change to a published package needs a changeset, or the release goes out
 * with an empty changelog and an unchanged version.
 *
 * A published package is a directory under `packages/` whose manifest is not
 * private, read from the manifests rather than listed here, so a new package is
 * covered the moment it exists. Docs, CI config, the apps and the private
 * packages reach no one who installs, so none of those ask for a changeset.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntry } from '../entry/entry.js';
import type { Differ, Manifest, Verdict } from './check-changeset.types.js';

export const gitDiff: Differ = (base, head) =>
  execFileSync('git', ['diff', '--name-only', `${base}...${head}`], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

/** Four levels up from `packages/tooling/src/check-changeset`, wherever the script is run from. */
export const REPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

/** The directory names under `packages/` whose manifest is not private. */
export const publishedDirs = (root: string): string[] =>
  readdirSync(join(root, 'packages')).filter((dir) => {
    const manifest = join(root, 'packages', dir, 'package.json');
    if (!existsSync(manifest)) return false;
    return (JSON.parse(readFileSync(manifest, 'utf8')) as Manifest).private !== true;
  });

/**
 * Whether the diff touches something a published package ships. Markdown and
 * unit tests inside a package are excluded: neither reaches the tarball, so
 * neither needs a changelog entry. `published` holds directory names.
 */
export const touchesPackage = (changed: string[], published: string[]): boolean =>
  changed.some(
    (file) =>
      published.some((dir) => file.startsWith(`packages/${dir}/`)) &&
      !file.endsWith('.md') &&
      !file.includes('/__tests__/') &&
      !file.endsWith('.test.ts'),
  );

export const hasChangeset = (changed: string[]): boolean =>
  changed.some(
    (file) => file.startsWith('.changeset/') && file.endsWith('.md') && !file.endsWith('README.md'),
  );

/**
 * The label that says this pull request needs no changelog entry.
 *
 * A dependency bump changes what the repository builds *with* and nothing about
 * what it publishes, so the gate has nothing to ask for — and a gate that asks
 * anyway teaches people to write empty changesets. Renovate applies this
 * label to every pull request it opens.
 */
export const SKIP_LABEL = 'skip-changeset';

/** The workflow hands labels over as one comma-separated string, or not at all. */
export const labelsOf = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean);

export const check = (changed: string[], published: string[], labels: string[] = []): Verdict => {
  if (!touchesPackage(changed, published)) {
    return { exitCode: 0, message: 'check-changeset: no publishable change, nothing to require' };
  }
  if (labels.includes(SKIP_LABEL)) {
    return { exitCode: 0, message: `check-changeset: \`${SKIP_LABEL}\` set on this pull request` };
  }
  if (hasChangeset(changed)) {
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
    diff = gitDiff,
    published = publishedDirs(REPO_ROOT),
  }: { diff?: Differ; published?: string[] } = {},
): number => {
  const base = env.BASE_SHA;
  const head = env.HEAD_SHA;

  if (!base || !head) {
    console.error('check-changeset: BASE_SHA and HEAD_SHA must be set');
    return 1;
  }

  const verdict = check(diff(base, head), published, labelsOf(env.PR_LABELS));
  if (verdict.exitCode === 0) console.log(verdict.message);
  else console.error(verdict.message);
  return verdict.exitCode;
};

/* v8 ignore start -- the entry shell; covered by the test that spawns this
   file, which reports no coverage back into this run. */
if (isEntry(import.meta.url)) {
  process.exit(main());
}
/* v8 ignore stop */
