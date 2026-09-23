/**
 * Whether a DOM is there to touch. Both globals are checked: a worker has
 * neither, and some server runtimes define `window` without a `document`.
 */
export const canUseDOM = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined';
