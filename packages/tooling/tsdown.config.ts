import { defineConfig } from 'tsdown';
import { baseBuildConfig } from './src/tsdown-preset/tsdown-preset.ts';

// The presets are built from source here: this is the package that publishes them.
export default defineConfig(
  baseBuildConfig({
    entry: {
      index: 'src/index.ts',
      cli: 'src/cli/cli.ts',
      tsdown: 'src/tsdown-preset/tsdown-preset.ts',
      vitest: 'src/vitest-preset/vitest-preset.ts',
    },
  }),
);
