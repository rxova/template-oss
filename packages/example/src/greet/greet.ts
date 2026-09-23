import type { GreetOptions } from './greet.types.js';

/** Greets `name`. Replace this with the package's real entry point. */
export const greet = (name: string, { excited = false }: GreetOptions = {}): string => {
  const who = name.trim();
  if (who === '') throw new TypeError('greet: name must not be empty');
  return `Hello, ${who}${excited ? '!' : '.'}`;
};
