/**
 * Whether developer-facing diagnostics should run.
 *
 * `process.env.NODE_ENV` is spelled out literally, and inside a try rather than
 * behind `typeof process`: browser bundlers replace that exact expression with a
 * string but provide no `process` global, so a `typeof process` guard reads
 * false in precisely the browser development builds the check exists for. Run
 * unbundled in a browser, the read throws and the answer is "no" — nobody is
 * watching a console there that the warning was written for.
 */
import type { DevGlobal } from './env.types.js';

// Typed here so the package needs no Node types: it runs in browsers too.
declare const process: { env: { NODE_ENV?: string } };

/**
 * A boolean `__DEV__` global wins outright. Otherwise anything but
 * `NODE_ENV=production` is development, React's rule: an unset `NODE_ENV` is
 * someone's machine, and a stray warning there costs less than a swallowed one.
 */
export const isDevelopment = (): boolean => {
  const flag = (globalThis as DevGlobal).__DEV__;
  if (typeof flag === 'boolean') return flag;
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
};
