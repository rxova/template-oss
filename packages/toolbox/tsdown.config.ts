import { defineConfig } from 'tsdown';
import { baseBuildConfig } from '@rxova/tooling/tsdown';

// Browser and Node alike, and inlined into packages with their own budgets, so
// the syntax floor is es2020 and nothing assumes a platform.
export default defineConfig(
  baseBuildConfig({
    entry: { index: 'src/index.ts', react: 'src/react.ts' },
    platform: 'neutral',
    target: 'es2020',
  }),
);
