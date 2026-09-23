/**
 * Per-repository settings, read from the `tooling` field of the root
 * `package.json`, so a repository that is happy with the defaults writes
 * nothing and one that is not has no extra file to find.
 *
 * Validated on read: a typo here would otherwise silently fall back to a
 * default, which is the kind of quiet drift the shared scripts exist to end.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Reader, Step, ToolingConfig } from './config.types.js';

export const readFile: Reader = (file) =>
  existsSync(file) ? readFileSync(file, 'utf8') : undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const fail = (path: string, expected: string): never => {
  throw new Error(`package.json#${path} must be ${expected}`);
};

const onlyKeys = (value: Record<string, unknown>, path: string, allowed: string[]): void => {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new Error(
        `package.json#${path} has an unknown key "${key}"; expected one of ${allowed.join(', ')}`,
      );
    }
  }
};

const parseSteps = (value: unknown): Step[] => {
  if (!Array.isArray(value)) return fail('tooling.verify.steps', 'an array');
  return value.map((step: unknown, index) => {
    if (
      !isRecord(step) ||
      typeof step.name !== 'string' ||
      step.name === '' ||
      typeof step.command !== 'string' ||
      step.command === ''
    ) {
      return fail(`tooling.verify.steps[${String(index)}]`, 'a { name, command } pair of strings');
    }
    return { name: step.name, command: step.command };
  });
};

/** Checks the raw `tooling` value and returns it typed. */
export const parseConfig = (raw: unknown): ToolingConfig => {
  if (raw === undefined) return {};
  if (!isRecord(raw)) return fail('tooling', 'an object');
  onlyKeys(raw, 'tooling', ['verify', 'changeset']);

  const config: ToolingConfig = {};
  if (raw.verify !== undefined) {
    if (!isRecord(raw.verify)) return fail('tooling.verify', 'an object');
    onlyKeys(raw.verify, 'tooling.verify', ['steps']);
    config.verify = raw.verify.steps === undefined ? {} : { steps: parseSteps(raw.verify.steps) };
  }
  if (raw.changeset !== undefined) {
    if (!isRecord(raw.changeset)) return fail('tooling.changeset', 'an object');
    onlyKeys(raw.changeset, 'tooling.changeset', ['singlePackage']);
    const { singlePackage } = raw.changeset;
    if (singlePackage !== undefined && typeof singlePackage !== 'boolean') {
      return fail('tooling.changeset.singlePackage', 'a boolean');
    }
    config.changeset = singlePackage === undefined ? {} : { singlePackage };
  }
  return config;
};

/** The `tooling` settings of the repository at `root`, or none. */
export const readConfig = (root: string, read: Reader = readFile): ToolingConfig => {
  const manifest = read(join(root, 'package.json'));
  if (manifest === undefined) return {};
  return parseConfig((JSON.parse(manifest) as { tooling?: unknown }).tooling);
};
