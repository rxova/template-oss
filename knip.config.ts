import { baseKnipConfig } from "@rxova/repo-config/knip";

/**
 * Unused files, exports and dependencies, as a gate rather than a report.
 *
 * The `export` keyword is the point: an export nothing imports still has to be
 * kept working, still shows up in completions, and still reads as part of the
 * contract. Nothing else in this repository notices one.
 *
 * Entry points are inferred from each package's manifest, so the preset only
 * needs to hear about what inference cannot see.
 */
export default baseKnipConfig({
  // The docs site does not depend on `@rxova/brand`, so the preset's default for it would be an unused ignore.
  docsApp: false,
  // `rxova-repo-config check-exports` runs `attw` from a shell command, where knip cannot see it.
  // `@rxova/ts-utils` is on hand for every package (tsdown inlines it, so a
  // published package stays dependency-free) before any placeholder code needs
  // it. Delete it here once something imports it: knip then flags the ignore.
  ignoreDependencies: ["@arethetypeswrong/cli", "@rxova/ts-utils"],
});
