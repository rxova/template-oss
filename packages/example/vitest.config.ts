import { baseVitestConfig } from "@rxova/repo-config/vitest";

// 95% per file on every axis. Raise a threshold as the suite improves; never
// lower one to get a build green.
export default baseVitestConfig({ root: import.meta.dirname });
