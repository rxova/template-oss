import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { main, PAGE_BUNDLE_FILENAME, pageBundleManifest, writeFile } from './write-page-bundle.js';

describe('pageBundleManifest', () => {
  it('builds the schema-2 page-component marker', () => {
    expect(pageBundleManifest('overlock', '/packages/overlock/')).toEqual({
      schema: 2,
      format: 'html-page-component',
      project: 'overlock',
      base: '/packages/overlock/',
    });
  });

  it.each(['Overlock', '-overlock', 'over_lock', ''])('rejects the project %j', (project) => {
    expect(() => pageBundleManifest(project, '/packages/x/')).toThrow('project');
  });

  it.each(['/', '/packages/x', 'packages/x/', '/Packages/x/', '/packages//'])(
    'rejects the base %j',
    (base) => {
      expect(() => pageBundleManifest('x', base)).toThrow('mount path');
    },
  );
});

describe('main', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  afterEach(() => {
    log.mockClear();
    error.mockClear();
  });

  it('writes the manifest into dist', () => {
    const write = vi.fn();
    expect(main(['dist', 'x', '/packages/x/'], { write, exists: () => true })).toBe(0);
    expect(write).toHaveBeenCalledWith(
      join('dist', PAGE_BUNDLE_FILENAME),
      `${JSON.stringify(pageBundleManifest('x', '/packages/x/'), null, 2)}\n`,
    );
  });

  it('prints usage without three arguments', () => {
    expect(main(['dist', 'x'])).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('usage:'));
  });

  it('fails when dist is missing, or a value is rejected', () => {
    expect(main(['dist', 'x', '/packages/x/'], { exists: () => false })).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('build the docs first'));
    expect(main(['dist', 'X', '/packages/x/'], { exists: () => true })).toBe(1);
  });
});

describe('writeFile', () => {
  it('writes to disk', () => {
    const dir = mkdtempSync(join(tmpdir(), 'page-bundle-'));
    try {
      writeFile(join(dir, 'a.json'), '{}');
      expect(readFileSync(join(dir, 'a.json'), 'utf8')).toBe('{}');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
