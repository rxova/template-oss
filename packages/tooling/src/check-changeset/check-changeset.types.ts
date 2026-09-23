/**
 * How the range is read. `existing` leaves out deleted files, so a pull
 * request that removes a changeset does not count as adding one. Injected so
 * the rule can be tested without a repo.
 */
export type Differ = (base: string, head: string, options?: { existing?: boolean }) => string[];

export interface Verdict {
  exitCode: 0 | 1;
  message: string;
}

export interface Manifest {
  private?: boolean;
}

/** What the pull request says about itself. */
export interface Request {
  labels?: string[];
  title?: string;
}
