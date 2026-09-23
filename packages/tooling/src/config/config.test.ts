import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseConfig, readConfig, readFile } from './config.js';

describe('parseConfig', () => {
  it('is empty when the field is absent', () => {
    expect(parseConfig(undefined)).toEqual({});
  });

  it('reads verify steps and the changeset rule', () => {
    expect(
      parseConfig({
        verify: { steps: [{ name: 'lint', command: 'pnpm lint' }] },
        changeset: { singlePackage: true },
      }),
    ).toEqual({
      verify: { steps: [{ name: 'lint', command: 'pnpm lint' }] },
      changeset: { singlePackage: true },
    });
  });

  it('keeps empty sections empty', () => {
    expect(parseConfig({ verify: {}, changeset: {} })).toEqual({ verify: {}, changeset: {} });
  });

  it.each([
    [[], 'package.json#tooling must be an object'],
    [{ verfy: {} }, 'unknown key "verfy"'],
    [{ verify: [] }, 'package.json#tooling.verify must be an object'],
    [{ verify: { step: [] } }, 'unknown key "step"'],
    [{ verify: { steps: {} } }, 'tooling.verify.steps must be an array'],
    [{ verify: { steps: [{ name: 'x' }] } }, 'tooling.verify.steps[0] must be'],
    [{ verify: { steps: [{ name: '', command: 'x' }] } }, 'tooling.verify.steps[0] must be'],
    [{ verify: { steps: [{ name: 'x', command: '' }] } }, 'tooling.verify.steps[0] must be'],
    [{ verify: { steps: ['pnpm lint'] } }, 'tooling.verify.steps[0] must be'],
    [{ changeset: true }, 'tooling.changeset must be an object'],
    [{ changeset: { single: true } }, 'unknown key "single"'],
    [{ changeset: { singlePackage: 'yes' } }, 'singlePackage must be a boolean'],
  ])('rejects %j', (raw, message) => {
    expect(() => parseConfig(raw)).toThrow(message);
  });
});

describe('readConfig', () => {
  it('reads the tooling field of the root manifest', () => {
    const read = () => JSON.stringify({ tooling: { changeset: { singlePackage: true } } });
    expect(readConfig('/repo', read)).toEqual({ changeset: { singlePackage: true } });
  });

  it('is empty without a manifest or a field', () => {
    expect(readConfig('/repo', () => undefined)).toEqual({});
    expect(readConfig('/repo', () => '{"name":"x"}')).toEqual({});
  });
});

describe('readFile', () => {
  it('reads a file, or nothing when it is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'config-'));
    try {
      writeFileSync(join(dir, 'a.txt'), 'hi');
      expect(readFile(join(dir, 'a.txt'))).toBe('hi');
      expect(readFile(join(dir, 'missing.txt'))).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
