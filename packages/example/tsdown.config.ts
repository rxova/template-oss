import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  // ESM only: every supported Node can `require()` an ES module, so a CJS twin
  // would double the tarball to serve nobody.
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  // `.js` / `.d.ts`, matching the exports map, rather than `.mjs` / `.d.mts`.
  fixedExtension: false,
  dts: true,
  clean: true,
});
