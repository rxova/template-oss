/**
 * The pre-push gate: the same ordered list CI runs, so a green push means a
 * green pipeline. Turbo replays whatever this commit did not touch, so a
 * re-push after a prose-only edit finishes in seconds.
 *
 * The list is `STEPS` unless the root `package.json` names its own under
 * `tooling.verify.steps`. `--only lint,build` runs a subset, in the list's order.
 */
import { execSync } from 'node:child_process';
import { readConfig } from '../config/config.js';
import type { Reader, Step } from '../config/config.types.js';
import { isEntry } from '../entry/entry.js';
import type { Runner } from './verify.types.js';

export const STEPS: Step[] = [
  { name: 'lint', command: 'pnpm lint' },
  { name: 'format', command: 'pnpm format:check' },
  { name: 'build', command: 'pnpm exec turbo run build' },
  { name: 'typecheck', command: 'pnpm exec turbo run typecheck' },
  { name: 'unit tests', command: 'pnpm exec turbo run test' },
  { name: 'package exports', command: 'pnpm run check:exports' },
  { name: 'pack smoke', command: 'pnpm run pack:smoke' },
  { name: 'dependency versions', command: 'pnpm run sherif:check' },
  { name: 'unused code', command: 'pnpm run knip:check' },
  // Kept after the two above: `pnpm dedupe --check` removes the modules
  // directory when CI is set, so a step after it runs without node_modules.
  { name: 'dependency dedupe', command: 'pnpm exec turbo run //#dedupe:check' },
  { name: 'audit', command: 'pnpm run audit:check' },
];

export const shell: Runner = (command) => {
  execSync(command, { stdio: 'inherit' });
};

/**
 * Stops at the first failure, because the second failure is usually the first
 * one wearing a different hat. Returns the process exit code.
 */
export const verify = (steps: Step[] = STEPS, { run = shell }: { run?: Runner } = {}): number => {
  for (const [index, { name, command }] of steps.entries()) {
    process.stdout.write(`\nverify: [${String(index + 1)}/${String(steps.length)}] ${name}\n`);
    try {
      run(command);
    } catch {
      process.stderr.write(`\nverify: ${name} failed — \`${command}\`\n`);
      return 1;
    }
  }

  process.stdout.write('\nverify: all checks passed\n');
  return 0;
};

/**
 * The steps named by `--only a,b` (or `--only=a,b`), in the list's order. An
 * unknown name throws: a typo that silently ran nothing would read as a pass.
 */
export const selectSteps = (steps: Step[], argv: readonly string[]): Step[] => {
  const at = argv.findIndex((arg) => arg === '--only' || arg.startsWith('--only='));
  if (at === -1) return steps;

  const flag = argv[at] ?? '';
  const value = flag.includes('=') ? flag.slice(flag.indexOf('=') + 1) : argv[at + 1];
  const wanted = (value ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  if (wanted.length === 0) throw new Error('--only needs a comma-separated list of step names');

  const known = new Set(steps.map((step) => step.name));
  const unknown = wanted.filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new Error(
      `unknown step(s): ${unknown.join(', ')}; the steps are ${[...known].join(', ')}`,
    );
  }
  return steps.filter((step) => wanted.includes(step.name));
};

/** Returns the process exit code rather than taking it, so tests can call it. */
export const main = (
  argv: readonly string[] = process.argv.slice(2),
  { root = process.cwd(), read, run = shell }: { root?: string; read?: Reader; run?: Runner } = {},
): number => {
  try {
    const steps = readConfig(root, read).verify?.steps ?? STEPS;
    return verify(selectSteps(steps, argv), { run });
  } catch (failure) {
    process.stderr.write(`verify: ${(failure as Error).message}\n`);
    return 1;
  }
};

/* v8 ignore start -- the entry shell: running it for real runs the entire
   pipeline, which is the thing this file exists to invoke. */
if (isEntry(import.meta.url)) {
  process.exit(main());
}
/* v8 ignore stop */
