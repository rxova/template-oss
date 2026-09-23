/**
 * One package's development warnings: a prefix, an optional stable code with a
 * link to the page that explains it, and a warn-once that dedupes by key.
 *
 * Production builds only drop the message strings when the call site itself
 * sits under a check the bundler can fold, so wrap hot or verbose calls in
 * `if (process.env.NODE_ENV !== 'production')` where the bytes matter.
 */
import { isDevelopment } from '../env/env.js';
import type { DevWarner, DevWarnerOptions, WarnOptions } from './dev-warner.types.js';

export const createDevWarner = ({
  prefix,
  docsUrl,
  enabled = isDevelopment,
  sink = (...args) => {
    // The whole point of this module; guarded above by `enabled`.
    // eslint-disable-next-line no-console
    console.warn(...args);
  },
}: DevWarnerOptions): DevWarner => {
  const seen = new Set<string>();

  const format = (message: string, code?: string): string => {
    if (code === undefined) return `[${prefix}] ${message}`;
    const link = docsUrl === undefined ? '' : `\n  → ${docsUrl}#${code.toLowerCase()}`;
    return `[${prefix}] ${code}: ${message}${link}`;
  };

  const warn = (message: string, { code, detail }: WarnOptions = {}): void => {
    if (!enabled()) return;
    const line = format(message, code);
    // A constant `%s` rather than the line as the format string: a `%` in an
    // interpolated value would otherwise be read as a directive and eat `detail`.
    if (detail === undefined) sink(line);
    else sink('%s', line, detail);
  };

  return {
    format,
    warn,
    warnOnce: (key, message, options) => {
      if (!enabled() || seen.has(key)) return;
      seen.add(key);
      warn(message, options);
    },
    reset: () => {
      seen.clear();
    },
  };
};
