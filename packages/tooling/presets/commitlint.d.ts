declare const config: {
  extends: string[];
  rules: Record<string, [level: 0 | 1 | 2, ...rest: unknown[]]>;
};
export default config;
