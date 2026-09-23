#!/usr/bin/env node
/**
 * `rxova-tooling <command>`: every repo script behind one bin, so a repository
 * installs one dev dependency instead of carrying a copy of each.
 *
 * Each command is the same module a repository could run directly; this only
 * picks one by name and hands it the rest of the arguments.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntry } from '../entry/entry.js';
import type { CommandEntry, Io } from './cli.types.js';

export const COMMANDS: Record<string, CommandEntry> = {
  verify: {
    summary: 'run the pre-push gate (package.json#tooling.verify.steps; --only a,b)',
    load: async () => {
      const { main } = await import('../verify/verify.js');
      return (argv) => main(argv);
    },
  },
  'check-changeset': {
    summary: 'require a changeset when a published package changed (BASE_SHA, HEAD_SHA)',
    load: async () => {
      const { main } = await import('../check-changeset/check-changeset.js');
      return () => main();
    },
  },
  'check-scope': {
    summary: 'report code-changed=false for a release commit (BASE_SHA, HEAD_SHA)',
    load: async () => {
      const { main } = await import('../check-scope/check-scope.js');
      return () => main();
    },
  },
  'node-floor': {
    summary: 'read the oldest Node the published packages support, for CI',
    load: async () => {
      const { main } = await import('../node-floor/node-floor.js');
      return () => main();
    },
  },
  'pack-smoke': {
    summary: 'pack, install, import and require a package from its tarball [dir]',
    load: async () => {
      const { main } = await import('../pack-smoke/pack-smoke.js');
      return (argv) => main(argv[0]);
    },
  },
  'check-llms': {
    summary: "check each published llms.txt against the package's exports [root]",
    load: async () => {
      const { main } = await import('../check-llms/check-llms.js');
      return (argv) => main(argv[0]);
    },
  },
  'write-page-bundle': {
    summary: 'mark a docs dist for the rxova.org aggregator <dist> <project> <base>',
    load: async () => {
      const { main } = await import('../write-page-bundle/write-page-bundle.js');
      return (argv) => main(argv);
    },
  },
};

/**
 * The version in this package's manifest, found by walking up from this file:
 * one level from the published `dist/`, two from `src/cli/`.
 */
export const ownVersion = (from: string = import.meta.url): string => {
  let dir = dirname(fileURLToPath(from));
  for (;;) {
    const manifest = join(dir, 'package.json');
    if (existsSync(manifest))
      return (JSON.parse(readFileSync(manifest, 'utf8')) as { version: string }).version;
    const parent = dirname(dir);
    if (parent === dir) throw new Error('rxova-tooling: no package.json above the CLI');
    dir = parent;
  }
};

export const usage = (commands: Record<string, CommandEntry> = COMMANDS): string => {
  const width = Math.max(...Object.keys(commands).map((name) => name.length));
  return [
    'usage: rxova-tooling <command> [args]',
    '',
    ...Object.entries(commands).map(([name, { summary }]) => `  ${name.padEnd(width)}  ${summary}`),
  ].join('\n');
};

const console_: Io = {
  out: (line) => {
    console.log(line);
  },
  err: (line) => {
    console.error(line);
  },
};

/** Returns the process exit code rather than taking it, so tests can call it. */
export const run = async (
  argv: readonly string[],
  {
    commands = COMMANDS,
    io = console_,
    version = ownVersion,
  }: { commands?: Record<string, CommandEntry>; io?: Io; version?: () => string } = {},
): Promise<number> => {
  const [name, ...rest] = argv;
  if (name === '--version' || name === '-v') {
    io.out(version());
    return 0;
  }
  if (name === undefined || name === '--help' || name === '-h') {
    io.out(usage(commands));
    return 0;
  }
  const command = Object.hasOwn(commands, name) ? commands[name] : undefined;
  if (command === undefined) {
    io.err(`rxova-tooling: unknown command "${name}"\n\n${usage(commands)}`);
    return 1;
  }
  return (await command.load())(rest);
};

/* v8 ignore start -- the entry shell; `run` is what the tests call. */
if (isEntry(import.meta.url)) {
  process.exitCode = await run(process.argv.slice(2));
}
/* v8 ignore stop */
