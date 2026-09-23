/** The one global `isDevelopment` reads first; test suites set it to force a branch. */
export type DevGlobal = typeof globalThis & { __DEV__?: unknown };
