import { rxova } from "@rxova/repo-config/eslint";
import tseslint from "typescript-eslint";

export default rxova({
  tsconfigRootDir: import.meta.dirname,
  strict: true,
  node: true,
  tests: true,
  extends: [tseslint.configs.stylisticTypeChecked],
});
