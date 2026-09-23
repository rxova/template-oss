/** The only thing this module needs a repository for. Injected for tests. */
export type Git = (...args: string[]) => string;

export interface Scope {
  codeChanged: boolean;
  reason: string;
}
