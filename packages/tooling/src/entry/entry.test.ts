import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isEntry } from '../entry/entry.js';

describe('isEntry', () => {
  const script = pathToFileURL('/repo/packages/tooling/src/verify/verify.ts').href;

  it('is true for the file Node was asked to run', () => {
    expect(isEntry(script, '/repo/packages/tooling/src/verify/verify.ts')).toBe(true);
  });

  it('is false for a module that was only imported', () => {
    expect(isEntry(script, '/repo/node_modules/vitest/vitest.mjs')).toBe(false);
  });

  it('is false when there is no script at all, as in a REPL', () => {
    expect(isEntry(script, undefined)).toBe(false);
    expect(isEntry(script, '')).toBe(false);
  });
});

describe('isEntry through a symlink', () => {
  it('follows the link an installed bin is run through', async () => {
    const { mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } =
      await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'entry-')));
    try {
      const target = join(dir, 'cli.js');
      const link = join(dir, 'bin');
      writeFileSync(target, '');
      symlinkSync(target, link);
      expect(isEntry(pathToFileURL(target).href, link)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
