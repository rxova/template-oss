/** The only file access this module needs. Injected for tests. */
export interface Workspace {
  list: (dir: string) => string[];
  read: (file: string) => string | undefined;
}

export interface Manifest {
  name?: string;
  private?: boolean;
  engines?: { node?: string };
}

export interface Published {
  dir: string;
  name: string;
  floor: string;
}
