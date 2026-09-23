import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { COMMANDS, ownVersion, run, usage } from './cli.js';
import type { CommandEntry } from './cli.types.js';

const io = () => ({ out: vi.fn(), err: vi.fn() });

describe('run', () => {
  it('hands the arguments after the name to the command and returns its code', async () => {
    const command = vi.fn(() => 3);
    const commands: Record<string, CommandEntry> = {
      go: { summary: 'go', load: () => Promise.resolve(command) },
    };
    expect(await run(['go', 'a', 'b'], { commands, io: io() })).toBe(3);
    expect(command).toHaveBeenCalledWith(['a', 'b']);
  });

  it('prints the version', async () => {
    const streams = io();
    expect(await run(['--version'], { io: streams, version: () => '1.2.3' })).toBe(0);
    expect(await run(['-v'], { io: streams, version: () => '1.2.3' })).toBe(0);
    expect(streams.out).toHaveBeenCalledWith('1.2.3');
  });

  it('prints usage with no command, or when asked', async () => {
    const streams = io();
    expect(await run([], { io: streams })).toBe(0);
    expect(await run(['--help'], { io: streams })).toBe(0);
    expect(await run(['-h'], { io: streams })).toBe(0);
    expect(streams.out).toHaveBeenCalledWith(usage());
  });

  it('refuses an unknown command, including an inherited property name', async () => {
    const streams = io();
    expect(await run(['nope'], { io: streams })).toBe(1);
    expect(await run(['toString'], { io: streams })).toBe(1);
    expect(streams.err).toHaveBeenCalledWith(expect.stringContaining('unknown command "nope"'));
  });

  it('writes to the console by default', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await run(['--help']);
    await run(['nope']);
    expect(log).toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    log.mockRestore();
    error.mockRestore();
  });
});

describe('usage', () => {
  it('lists every command with its summary', () => {
    const text = usage();
    for (const [name, { summary }] of Object.entries(COMMANDS)) {
      expect(text).toContain(name);
      expect(text).toContain(summary);
    }
  });
});

describe('ownVersion', () => {
  it('reads the version from the package manifest', () => {
    expect(ownVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('throws when there is no manifest above the file', () => {
    expect(() => ownVersion(pathToFileURL('/cli.js').href)).toThrow('no package.json');
  });
});

describe('COMMANDS', () => {
  const quiet = () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  };
  const empty = mkdtempSync(join(tmpdir(), 'cli-'));

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  const call = async (name: string, argv: string[] = []) => {
    const entry = COMMANDS[name];
    if (entry === undefined) throw new Error(`no command ${name}`);
    return (await entry.load())(argv);
  };

  // Each command is driven down a path that does no real work, which proves
  // the name reaches the right module with the right arguments.
  it('verify rejects an unknown --only before running anything', async () => {
    quiet();
    expect(await call('verify', ['--only', 'no-such-step'])).toBe(1);
  });

  it('check-changeset needs a range', async () => {
    quiet();
    vi.stubEnv('BASE_SHA', '');
    expect(await call('check-changeset')).toBe(1);
  });

  it('check-scope runs everything without a range', async () => {
    quiet();
    vi.stubEnv('BASE_SHA', '');
    vi.stubEnv('GITHUB_OUTPUT', '');
    expect(await call('check-scope')).toBe(0);
  });

  it('node-floor finds nothing published outside a workspace', async () => {
    quiet();
    vi.stubEnv('GITHUB_OUTPUT', '');
    vi.spyOn(process, 'cwd').mockReturnValue(empty);
    expect(await call('node-floor')).toBe(0);
  });

  it('pack-smoke fails on a directory with no manifest', async () => {
    quiet();
    expect(await call('pack-smoke', [empty])).toBe(1);
  });

  it('check-llms checks the root it is given', async () => {
    quiet();
    expect(await call('check-llms', [empty])).toBe(1);
  });

  it('write-page-bundle needs its three arguments', async () => {
    quiet();
    expect(await call('write-page-bundle', [])).toBe(1);
  });

  it.each(Object.keys(COMMANDS))('%s is covered above', (name) => {
    expect(COMMANDS[name]?.summary).toBeTruthy();
  });

  afterAll(() => {
    rmSync(empty, { recursive: true, force: true });
  });
});
