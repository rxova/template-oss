import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  binsOf,
  main,
  packSmoke,
  probeSource,
  shell,
  shippedFiles,
  workspace,
} from './pack-smoke.js';
import type { Manifest, Shell, Workspace } from './pack-smoke.types.js';

const SCRATCH = '/scratch';
/** Where the workspace packages sit beside `/pkg`, spelled the way `join` spells it here. */
const PARENT = join('/pkg', '..');

/**
 * An in-memory workspace holding one package manifest. Listing the scratch
 * directory shows the tarball; listing anything else shows the installed package.
 */
const memory = (
  manifest: Manifest,
  {
    tarball = true,
    installed = ['LICENSE', 'README.md', 'dist', 'package.json'],
    extra = {},
  }: { tarball?: boolean; installed?: string[]; extra?: Record<string, string> } = {},
) => {
  const files = new Map<string, string>([
    [join('/pkg', 'package.json'), JSON.stringify(manifest)],
    ...Object.entries(extra),
  ]);
  const removed: string[] = [];
  const fs: Workspace = {
    make: () => SCRATCH,
    list: (dir) => (dir === SCRATCH ? (tarball ? ['scope-example-0.1.0.tgz'] : []) : installed),
    read: (file) => {
      const contents = files.get(file);
      if (contents === undefined) throw new Error(`ENOENT: ${file}`);
      return contents;
    },
    write: (file, contents) => void files.set(file, contents),
    remove: (dir) => void removed.push(dir),
  };
  return { fs, files, removed };
};

/** A shell that answers like a healthy npm, with per-command overrides. */
const npm =
  (overrides: { version?: string; probe?: string } = {}): Shell =>
  (command, args) => {
    if (command === 'npx') return `${overrides.version ?? '1.2.3'}\n`;
    if (command === 'node') return `${overrides.probe ?? 'ok'}\n`;
    return args.join(' ');
  };

describe('binsOf', () => {
  it('names a string bin after the package, scope dropped', () => {
    expect(binsOf({ name: '@scope/example', version: '1.0.0', bin: './dist/cli.js' })).toEqual([
      'example',
    ]);
  });

  it('lists every key of a bin map', () => {
    expect(binsOf({ name: 'x', version: '1.0.0', bin: { a: './a.js', b: './b.js' } })).toEqual([
      'a',
      'b',
    ]);
  });

  it('is empty for a library with no bin', () => {
    expect(binsOf({ name: 'x', version: '1.0.0' })).toEqual([]);
  });
});

describe('shippedFiles', () => {
  it('always wants the license and the README', () => {
    expect(shippedFiles({ name: 'x', version: '1.0.0' })).toEqual(['LICENSE', 'README.md']);
  });

  it('adds every other `files` entry, leaving dist to the probe', () => {
    expect(shippedFiles({ name: 'x', version: '1.0.0', files: ['dist', 'schema.json'] })).toEqual([
      'LICENSE',
      'README.md',
      'schema.json',
    ]);
  });
});

describe('probeSource', () => {
  it('imports and requires the package by name through its exports map', () => {
    const source = probeSource('@scope/example');
    expect(source).toContain('await import("@scope/example")');
    expect(source).toContain('createRequire(import.meta.url)("@scope/example")');
  });
});

describe('packSmoke', () => {
  it('packs, installs, imports, and cleans up', () => {
    const { fs, files, removed } = memory({ name: '@scope/example', version: '0.1.0' });
    const calls: string[] = [];
    const sh: Shell = (command, args, cwd) => {
      calls.push(`${command} ${args[0] ?? ''} @ ${cwd}`);
      return npm()(command, args, cwd);
    };

    expect(packSmoke({ pkgDir: '/pkg', sh, fs })).toBe(
      'pack:smoke ok — @scope/example@0.1.0 installs, imports and requires from a tarball',
    );
    expect(calls).toEqual([
      'npm pack @ /pkg',
      `npm install @ ${SCRATCH}`,
      `node ${join(SCRATCH, 'probe.mjs')} @ ${SCRATCH}`,
    ]);
    expect(files.get(join(SCRATCH, 'probe.mjs'))).toContain('@scope/example');
    expect(removed).toEqual([SCRATCH]);
  });

  it('packs each workspace dependency and repacks the package pointing at it', () => {
    const manifest = {
      name: '@scope/example',
      version: '0.1.0',
      dependencies: { '@scope/core': 'workspace:^', zod: '^4.0.0' },
    };
    const { fs, files } = memory(manifest, {
      extra: {
        [join(SCRATCH, 'package', 'package.json')]: JSON.stringify(manifest),
        [join('/', 'config', 'package.json')]: 'not json',
        [join('/', 'core', 'package.json')]: JSON.stringify({ name: '@scope/core' }),
      },
    });
    const listed = fs.list;
    fs.list = (dir) => (dir === PARENT ? ['config', 'core', 'pkg', 'empty'] : listed(dir));
    const calls: string[] = [];
    const sh: Shell = (command, args, cwd) => {
      calls.push(`${command} ${args.join(' ')} @ ${cwd}`);
      return args.includes('--json')
        ? JSON.stringify([{ filename: 'scope-core-0.0.0.tgz' }])
        : npm()(command, args, cwd);
    };

    expect(packSmoke({ pkgDir: '/pkg', sh, fs })).toContain('@scope/example@0.1.0 installs');
    expect(calls.slice(1, 4)).toEqual([
      `tar -xzf ${join(SCRATCH, 'scope-example-0.1.0.tgz')} -C ${SCRATCH} @ ${SCRATCH}`,
      `npm pack --ignore-scripts --json --pack-destination ${SCRATCH} @ ${join('/', 'core')}`,
      `npm pack --ignore-scripts --pack-destination ${SCRATCH} @ ${join(SCRATCH, 'package')}`,
    ]);
    const repacked = JSON.parse(
      files.get(join(SCRATCH, 'package', 'package.json')) ?? '',
    ) as Manifest;
    expect(repacked.dependencies).toEqual({
      '@scope/core': `file:${join(SCRATCH, 'scope-core-0.0.0.tgz')}`,
      zod: '^4.0.0',
    });
  });

  it('fails on a workspace dependency with no package beside it, or no tarball', () => {
    const manifest = { name: 'x', version: '1.0.0', dependencies: { y: 'workspace:*' } };
    const extra = { [join(SCRATCH, 'package', 'package.json')]: JSON.stringify(manifest) };
    const { fs } = memory(manifest, { extra });
    fs.list = (dir) => (dir === PARENT ? [] : ['x-1.0.0.tgz']);
    expect(() => packSmoke({ pkgDir: '/pkg', sh: npm(), fs })).toThrow(
      'no workspace package named y beside /pkg',
    );
    const other = memory(manifest, {
      extra: { ...extra, [join('/', 'y', 'package.json')]: JSON.stringify({ name: 'y' }) },
    });
    other.fs.list = (dir) => (dir === PARENT ? ['y'] : ['x-1.0.0.tgz']);
    const empty: Shell = (command, args, cwd) =>
      args.includes('--json') ? '[]' : npm()(command, args, cwd);
    expect(() => packSmoke({ pkgDir: '/pkg', sh: empty, fs: other.fs })).toThrow(
      `npm pack produced no tarball for ${join('/', 'y')}`,
    );
  });

  it('runs every bin the package declares', () => {
    const { fs } = memory({ name: 'tool', version: '1.2.3', bin: { tool: './dist/cli.js' } });
    const sh = vi.fn(npm());
    packSmoke({ pkgDir: '/pkg', sh, fs });
    expect(sh).toHaveBeenCalledWith('npx', ['--no-install', 'tool', '--version'], SCRATCH);
  });

  it('fails when npm pack wrote no tarball, and still cleans up', () => {
    const { fs, removed } = memory({ name: 'x', version: '1.0.0' }, { tarball: false });
    expect(() => packSmoke({ pkgDir: '/pkg', sh: npm(), fs })).toThrow('produced no tarball');
    expect(removed).toEqual([SCRATCH]);
  });

  it('fails when the installed package is missing a shipped file', () => {
    const { fs, removed } = memory(
      { name: 'x', version: '1.0.0', files: ['dist', 'schema.json'] },
      { installed: ['README.md', 'dist', 'package.json'] },
    );
    expect(() => packSmoke({ pkgDir: '/pkg', sh: npm(), fs })).toThrow(
      'the tarball does not contain LICENSE, schema.json',
    );
    expect(removed).toEqual([SCRATCH]);
  });

  it('fails when a bin prints something that is not a version', () => {
    const { fs } = memory({ name: 'tool', version: '1.0.0', bin: './cli.js' });
    expect(() =>
      packSmoke({ pkgDir: '/pkg', sh: npm({ version: 'command not found' }), fs }),
    ).toThrow('unusable version');
  });

  it('fails when the probe does not print ok', () => {
    const { fs } = memory({ name: 'x', version: '1.0.0' });
    expect(() => packSmoke({ pkgDir: '/pkg', sh: npm({ probe: 'boom' }), fs })).toThrow(
      'probe failed: boom',
    );
  });
});

describe('main', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  afterEach(() => {
    log.mockClear();
    error.mockClear();
  });

  it('prints the verdict and exits 0', () => {
    const { fs } = memory({ name: 'x', version: '1.0.0' });
    expect(main('/pkg', { sh: npm(), fs })).toBe(0);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('pack:smoke ok'));
  });

  it('prints the failure and exits 1', () => {
    const { fs } = memory({ name: 'x', version: '1.0.0' }, { tarball: false });
    expect(main('/pkg', { sh: npm(), fs })).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('pack:smoke failed'));
  });
});

describe('the real shell and workspace', () => {
  it('runs a command and returns its output', () => {
    expect(shell(process.execPath, ['-e', 'process.stdout.write("hi")'], process.cwd())).toBe('hi');
  });

  it('makes, writes, reads, lists and removes a scratch directory', () => {
    const dir = workspace.make();
    const file = join(dir, 'a.txt');
    workspace.write(file, 'hello');
    expect(workspace.read(file)).toBe('hello');
    expect(workspace.list(dir)).toEqual(['a.txt']);
    mkdirSync(join(dir, 'nested'));
    workspace.remove(dir);
    expect(existsSync(dir)).toBe(false);
    expect(() => readFileSync(file)).toThrow();
  });
});
