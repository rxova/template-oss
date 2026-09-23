/**
 * Whether this module is the file Node was asked to run.
 *
 * Every script here exports its work as functions and runs it only behind this
 * check, so that importing one from a test costs nothing. `require.main` has no
 * ESM equivalent, and comparing raw paths is wrong the moment one side is a
 * file URL and the other is not, so both sides are normalised to a URL. The
 * script path is resolved through symlinks first: an installed bin is a link in
 * `node_modules/.bin`, and pnpm links every package into place.
 */
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const real = (path: string): string => {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
};

export const isEntry = (moduleUrl: string, argv1: string | undefined = process.argv[1]): boolean =>
  argv1 !== undefined && argv1 !== '' && pathToFileURL(real(argv1)).href === moduleUrl;
