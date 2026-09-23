/**
 * Marks a built docs dist as a page-component bundle for the rxova.org
 * aggregator.
 *
 * The aggregator never builds a project's docs: it downloads the dist and
 * composes each rendered body into its own shell. This manifest is how it knows
 * which project the artifact belongs to and what base path it was built for — a
 * dist built at the wrong base is the one failure the receiver cannot detect by
 * looking at the HTML. The rules below are the receiver's, checked here so a
 * bad value fails the build that wrote it rather than the deploy that reads it.
 *
 * Usage: `rxova-tooling write-page-bundle <dist> <project> <base>`, e.g.
 * `rxova-tooling write-page-bundle apps/docs/dist overlock /packages/overlock/`.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isEntry } from '../entry/entry.js';
import type { PageBundleManifest, Writer } from './write-page-bundle.types.js';

export const PAGE_BUNDLE_FILENAME = 'rxova-page-bundle.json';

const PROJECT = /^[a-z0-9][a-z0-9-]*$/;
const BASE = /^\/(?:[a-z0-9][a-z0-9-]*\/)+$/;

export const pageBundleManifest = (project: string, base: string): PageBundleManifest => {
  if (!PROJECT.test(project)) {
    throw new Error(
      `project "${project}" must be lowercase letters, digits and dashes, not starting with a dash`,
    );
  }
  if (!BASE.test(base)) {
    throw new Error(`base "${base}" must be a mount path like /packages/name/`);
  }
  return { schema: 2, format: 'html-page-component', project, base };
};

export const writeFile: Writer = (file, contents) => {
  writeFileSync(file, contents);
};

/** Returns the process exit code rather than taking it, so tests can call it. */
export const main = (
  argv: readonly string[] = process.argv.slice(2),
  {
    write = writeFile,
    exists = existsSync,
  }: { write?: Writer; exists?: (path: string) => boolean } = {},
): number => {
  const [dist, project, base] = argv;
  if (dist === undefined || project === undefined || base === undefined) {
    console.error('usage: rxova-tooling write-page-bundle <dist> <project> <base>');
    return 1;
  }
  try {
    if (!exists(dist)) throw new Error(`${dist} does not exist; build the docs first`);
    const file = join(dist, PAGE_BUNDLE_FILENAME);
    write(file, `${JSON.stringify(pageBundleManifest(project, base), null, 2)}\n`);
    console.log(`write-page-bundle: wrote ${file}`);
    return 0;
  } catch (failure) {
    console.error(`write-page-bundle failed — ${(failure as Error).message}`);
    return 1;
  }
};

/* v8 ignore start -- the entry shell; `main` is what the tests call. */
if (isEntry(import.meta.url)) {
  process.exit(main());
}
/* v8 ignore stop */
