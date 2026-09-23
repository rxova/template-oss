export interface DevWarnerOptions {
  /** Shown in brackets before every message: `[my-package] …`. */
  readonly prefix: string;
  /** Page that explains each code; the code is appended as `#code`. */
  readonly docsUrl?: string;
  /** Whether to warn at all. Defaults to `isDevelopment`, read on every call. */
  readonly enabled?: () => boolean;
  /** Where a warning goes. Defaults to `console.warn`. */
  readonly sink?: (...args: unknown[]) => void;
}

export interface WarnOptions {
  /** A stable code such as `UE1001`, which survives rewording and minifiers. */
  readonly code?: string;
  /** Structured context, logged as its own argument so it stays inspectable. */
  readonly detail?: unknown;
}

export interface DevWarner {
  /** The line a warning prints, without printing it. */
  format: (message: string, code?: string) => string;
  /** Warns every time. */
  warn: (message: string, options?: WarnOptions) => void;
  /** Warns the first time `key` is seen, so a render loop cannot flood the console. */
  warnOnce: (key: string, message: string, options?: WarnOptions) => void;
  /** Forgets every key `warnOnce` has seen. For tests. */
  reset: () => void;
}
