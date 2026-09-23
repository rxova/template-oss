/** The marker the rxova.org aggregator reads from a docs site's dist. */
export interface PageBundleManifest {
  schema: 2;
  format: 'html-page-component';
  project: string;
  base: string;
}

/** Writes a file. Injected for tests. */
export type Writer = (file: string, contents: string) => void;
