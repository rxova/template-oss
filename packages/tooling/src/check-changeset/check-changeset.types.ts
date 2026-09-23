/** How the range is read. Injected so the rule can be tested without a repo. */
export type Differ = (base: string, head: string) => string[];

export interface Verdict {
  exitCode: 0 | 1;
  message: string;
}

export interface Manifest {
  private?: boolean;
}
