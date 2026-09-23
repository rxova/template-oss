import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  check,
  gitDiff,
  hasChangeset,
  labelsOf,
  main,
  SKIP_LABEL,
  packagesNamed,
  publishedDirs,
  singlePackageProblems,
  touchesPackage,
} from './check-changeset.js';

const REPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

const PUBLISHED = ['example'];

describe('publishedDirs', () => {
  it('finds the non-private packages of this repository', () => {
    expect(publishedDirs(REPO_ROOT).sort()).toEqual(['example', 'toolbox', 'tooling']);
  });

  it('leaves a private package out', () => {
    const root = mkdtempSync(join(tmpdir(), 'check-changeset-'));
    try {
      mkdirSync(join(root, 'packages', 'internal'), { recursive: true });
      writeFileSync(join(root, 'packages', 'internal', 'package.json'), '{"private":true}');
      expect(publishedDirs(root)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('skips a directory without a manifest', () => {
    const root = mkdtempSync(join(tmpdir(), 'check-changeset-'));
    try {
      mkdirSync(join(root, 'packages', 'empty'), { recursive: true });
      mkdirSync(join(root, 'packages', 'lib'));
      writeFileSync(join(root, 'packages', 'lib', 'package.json'), '{"name":"lib"}');
      expect(publishedDirs(root)).toEqual(['lib']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('is empty where there is no packages directory', () => {
    expect(publishedDirs(join(tmpdir(), 'no-such-repo'))).toEqual([]);
  });
});

describe('touchesPackage', () => {
  it('sees a source change', () => {
    expect(touchesPackage(['packages/example/src/index.ts'], PUBLISHED)).toBe(true);
  });

  it.each([
    'packages/example/README.md',
    'packages/example/src/index.test.ts',
    'packages/example/src/__tests__/fixture.ts',
    'packages/example/src/view.test.tsx',
    'packages/example/src/__fixtures__/patch.diff',
    'packages/example/e2e/cli.ts',
    'packages/example-two/src/index.ts',
    'packages/tooling/src/verify/verify.ts',
    'packages/config/tsdown.base.ts',
    'apps/docs/src/content/docs/index.mdx',
    '.github/workflows/ci.yml',
    'README.md',
  ])('does not count %s as publishable', (file) => {
    expect(touchesPackage([file], PUBLISHED)).toBe(false);
  });

  it('is true as soon as one file in the set ships', () => {
    expect(touchesPackage(['README.md', 'packages/example/src/index.ts'], PUBLISHED)).toBe(true);
  });

  it('is false for an empty diff', () => {
    expect(touchesPackage([], PUBLISHED)).toBe(false);
  });
});

describe('hasChangeset', () => {
  it('recognises a changeset', () => {
    expect(hasChangeset(['.changeset/tidy-pandas-smile.md'])).toBe(true);
  });

  it.each(['.changeset/README.md', '.changeset/config.json', 'docs/changeset.md'])(
    'does not accept %s',
    (file) => {
      expect(hasChangeset([file])).toBe(false);
    },
  );
});

describe('check', () => {
  it('requires nothing when nothing publishable changed', () => {
    const verdict = check(['packages/tooling/src/verify/verify.ts'], PUBLISHED);
    expect(verdict.exitCode).toBe(0);
    expect(verdict.message).toContain('no publishable change');
  });

  it('is satisfied by a changeset alongside the change', () => {
    const verdict = check(
      ['packages/example/src/index.ts', '.changeset/tidy-pandas-smile.md'],
      PUBLISHED,
    );
    expect(verdict.exitCode).toBe(0);
    expect(verdict.message).toContain('changeset present');
  });

  it('fails a publishable change with no changeset, and says what to do', () => {
    const verdict = check(['packages/example/src/index.ts'], PUBLISHED);
    expect(verdict.exitCode).toBe(1);
    expect(verdict.message).toContain('adds no changeset');
    expect(verdict.message).toContain('pnpm changeset');
    expect(verdict.message).toContain(SKIP_LABEL);
  });

  it('asks for nothing when the pull request carries the label', () => {
    const verdict = check(['packages/example/package.json'], PUBLISHED, {
      labels: ['dependencies', SKIP_LABEL],
    });
    expect(verdict.exitCode).toBe(0);
    expect(verdict.message).toContain(SKIP_LABEL);
  });

  it('asks for nothing when the title carries the marker', () => {
    const verdict = check(['packages/example/package.json'], PUBLISHED, {
      title: `chore: bump [${SKIP_LABEL}]`,
    });
    expect(verdict.exitCode).toBe(0);
    expect(verdict.message).toContain('title');
  });

  it('is not satisfied by some other label, or the bare word in the title', () => {
    const changed = ['packages/example/src/index.ts'];
    expect(check(changed, PUBLISHED, { labels: ['dependencies'] }).exitCode).toBe(1);
    expect(check(changed, PUBLISHED, { title: SKIP_LABEL }).exitCode).toBe(1);
  });

  it('does not count a changeset the pull request deletes', () => {
    const changed = ['packages/example/src/index.ts', '.changeset/old.md'];
    const present = ['packages/example/src/index.ts'];
    expect(check(changed, PUBLISHED, {}, { present }).exitCode).toBe(1);
  });
});

describe('labelsOf', () => {
  it('reads the comma-separated list the workflow hands over', () => {
    expect(labelsOf('dependencies,skip-changeset')).toEqual(['dependencies', 'skip-changeset']);
  });

  it('tolerates spacing, and an unlabelled pull request', () => {
    expect(labelsOf(' dependencies , skip-changeset ')).toEqual(['dependencies', 'skip-changeset']);
    expect(labelsOf('')).toEqual([]);
    expect(labelsOf(undefined)).toEqual([]);
  });
});

describe('main', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  afterEach(() => {
    log.mockClear();
    error.mockClear();
  });

  const range = { BASE_SHA: 'aaa', HEAD_SHA: 'bbb' };
  const deps = (changed: string[], files: Record<string, string> = {}) => ({
    root: '/repo',
    published: PUBLISHED,
    diff: vi.fn(() => changed),
    read: (file: string) => files[file],
  });

  it('refuses to guess when the range is missing', () => {
    expect(main({})).toBe(1);
    expect(main({ BASE_SHA: 'a' })).toBe(1);
    expect(main({ HEAD_SHA: 'b' })).toBe(1);
    expect(error).toHaveBeenCalledWith('check-changeset: BASE_SHA and HEAD_SHA must be set');
  });

  it('asks for the diff of exactly the range it was given, with and without deletions', () => {
    const options = deps(['packages/tooling/src/verify/verify.ts']);
    expect(main(range, options)).toBe(0);
    expect(options.diff).toHaveBeenCalledWith('aaa', 'bbb');
    expect(options.diff).toHaveBeenCalledWith('aaa', 'bbb', { existing: true });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('no publishable change'));
  });

  it('reports a missing changeset on stderr and exits 1', () => {
    expect(main(range, deps(['packages/example/src/index.ts']))).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('adds no changeset'));
  });

  it('reads the label and the title from the environment the workflow sets', () => {
    const options = deps(['packages/example/package.json']);
    expect(main({ ...range, PR_LABELS: `dependencies,${SKIP_LABEL}` }, options)).toBe(0);
    expect(main({ ...range, PR_TITLE: `[${SKIP_LABEL}] bump` }, options)).toBe(0);
  });

  describe('with singlePackage set', () => {
    const manifest = JSON.stringify({ tooling: { changeset: { singlePackage: true } } });
    const changed = ['packages/example/src/index.ts', '.changeset/a.md'];

    it('passes a changeset that names one package', () => {
      const files = {
        '/repo/package.json': manifest,
        '/repo/.changeset/a.md': "---\n'@rxova/example': patch\n---\n\nFix.\n",
      };
      expect(main(range, deps(changed, files))).toBe(0);
    });

    it('fails a changeset that names two, and says which', () => {
      const files = {
        '/repo/package.json': manifest,
        '/repo/.changeset/a.md': '---\n"a": patch\n"b": minor\n---\n',
      };
      expect(main(range, deps(changed, files))).toBe(1);
      expect(error).toHaveBeenCalledWith(expect.stringContaining('names 2 packages, expected 1'));
    });
  });

  it('reports a malformed config instead of throwing', () => {
    const files = { '/repo/package.json': '{"tooling":{"changeset":1}}' };
    expect(main(range, deps([], files))).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('tooling.changeset must be'));
  });
});

describe('packagesNamed', () => {
  it.each([
    ["---\n'@scope/a': patch\n---\n", 1],
    ['---\n"a": minor # why\n"b": major\n---', 2],
    ['---\n---\n', 0],
    ['no frontmatter', 0],
  ])('counts %j as %d', (body, count) => {
    expect(packagesNamed(body)).toBe(count);
  });
});

describe('singlePackageProblems', () => {
  it('flags an unreadable file', () => {
    expect(singlePackageProblems(['x.md'], () => undefined)).toEqual(['  x.md: could not be read']);
  });
});

describe('gitDiff', () => {
  it('lists the files an empty range changed — none', () => {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    expect(gitDiff(head, head)).toEqual([]);
    expect(gitDiff(head, head, { existing: true })).toEqual([]);
  });
});

describe('the entry point', () => {
  it('sets the process exit code from main', () => {
    const script = fileURLToPath(new URL('./check-changeset.ts', import.meta.url));
    let status = 0;
    try {
      // No range in the environment: the one failure that needs no repository.
      execFileSync(process.execPath, ['--import', 'tsx', script], {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, BASE_SHA: '', HEAD_SHA: '' },
      });
    } catch (failure) {
      status = (failure as { status: number }).status;
    }
    expect(status).toBe(1);
  });
});
