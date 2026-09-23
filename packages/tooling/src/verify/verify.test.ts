import { afterEach, describe, expect, it, vi } from 'vitest';
import { main, selectSteps, STEPS, shell, verify } from './verify.js';

const step = (name: string, command = `echo ${name}`) => ({ name, command });

describe('STEPS', () => {
  it('is the list CI runs, in the order CI runs it', () => {
    expect(STEPS.map(({ name }) => name)).toEqual([
      'lint',
      'format',
      'build',
      'typecheck',
      'unit tests',
      'package exports',
      'pack smoke',
      'dependency versions',
      'unused code',
      'dependency dedupe',
      'audit',
    ]);
  });
});

describe('verify', () => {
  const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const err = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  afterEach(() => {
    out.mockClear();
    err.mockClear();
  });

  it('runs every step in order and passes', () => {
    const ran: string[] = [];
    const code = verify([step('first', 'echo one'), step('second', 'echo two')], {
      run: (command) => void ran.push(command),
    });

    expect(code).toBe(0);
    expect(ran).toEqual(['echo one', 'echo two']);
    expect(out).toHaveBeenCalledWith('\nverify: all checks passed\n');
  });

  it('stops at the first failure and names the step and its command', () => {
    const ran: string[] = [];
    const code = verify([step('first'), step('second', 'boom'), step('third')], {
      run: (command) => {
        ran.push(command);
        if (command === 'boom') throw new Error('exit 1');
      },
    });

    expect(code).toBe(1);
    expect(ran).toEqual(['echo first', 'boom']);
    expect(err).toHaveBeenCalledWith('\nverify: second failed — `boom`\n');
    expect(out).not.toHaveBeenCalledWith('\nverify: all checks passed\n');
  });

  it('announces each step with its position before running it', () => {
    verify([step('lint'), step('format')], { run: () => {} });
    expect(out).toHaveBeenCalledWith('\nverify: [1/2] lint\n');
    expect(out).toHaveBeenCalledWith('\nverify: [2/2] format\n');
  });

  it('passes trivially on an empty list', () => {
    expect(verify([], { run: () => {} })).toBe(0);
  });
});

describe('selectSteps', () => {
  const steps = [step('lint'), step('build'), step('test')];

  it('keeps every step without --only', () => {
    expect(selectSteps(steps, [])).toBe(steps);
  });

  it('keeps the named steps in list order, in either flag spelling', () => {
    expect(selectSteps(steps, ['--only', 'test,lint']).map(({ name }) => name)).toEqual([
      'lint',
      'test',
    ]);
    expect(selectSteps(steps, ['--only=build']).map(({ name }) => name)).toEqual(['build']);
  });

  it('refuses an empty list', () => {
    expect(() => selectSteps(steps, ['--only'])).toThrow('comma-separated list');
    expect(() => selectSteps(steps, ['--only=, '])).toThrow('comma-separated list');
  });

  it('refuses an unknown name rather than running nothing', () => {
    expect(() => selectSteps(steps, ['--only', 'lnt'])).toThrow(
      'unknown step(s): lnt; the steps are lint, build, test',
    );
  });
});

describe('main', () => {
  const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const err = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  afterEach(() => {
    out.mockClear();
    err.mockClear();
  });

  it('runs the default list when the repository names none', () => {
    const ran: string[] = [];
    expect(main([], { read: () => undefined, run: (command) => void ran.push(command) })).toBe(0);
    expect(ran).toEqual(STEPS.map(({ command }) => command));
  });

  it('runs the list from package.json#tooling.verify.steps', () => {
    const ran: string[] = [];
    const read = () => JSON.stringify({ tooling: { verify: { steps: [step('only', 'x')] } } });
    expect(main([], { read, run: (command) => void ran.push(command) })).toBe(0);
    expect(ran).toEqual(['x']);
  });

  it('honours --only', () => {
    const ran: string[] = [];
    main(['--only', 'lint'], { read: () => undefined, run: (command) => void ran.push(command) });
    expect(ran).toEqual(['pnpm lint']);
  });

  it('fails with the reason when the config or the flags are wrong', () => {
    expect(main([], { read: () => '{"tooling":{"verify":[]}}', run: () => {} })).toBe(1);
    expect(err).toHaveBeenCalledWith(expect.stringContaining('tooling.verify must be an object'));
    expect(main(['--only', 'nope'], { read: () => undefined, run: () => {} })).toBe(1);
  });
});

describe('shell', () => {
  it('runs a command', () => {
    expect(() => {
      shell(`"${process.execPath}" -e "0"`);
    }).not.toThrow();
  });

  it('throws when the command fails, which is what verify catches', () => {
    expect(() => {
      shell(`"${process.execPath}" -e "process.exit(3)"`);
    }).toThrow();
  });
});
