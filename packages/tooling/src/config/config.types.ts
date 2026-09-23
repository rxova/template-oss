/** One command the pre-push gate runs. */
export interface Step {
  name: string;
  command: string;
}

/** The `tooling` field of the root `package.json`. Every key is optional. */
export interface ToolingConfig {
  verify?: {
    /** The ordered gate. Replaces the default list entirely. */
    steps?: Step[];
  };
  changeset?: {
    /** Each changeset file names exactly one package. */
    singlePackage?: boolean;
  };
}

/** Reads a file, or undefined when there is none. Injected for tests. */
export type Reader = (file: string) => string | undefined;
