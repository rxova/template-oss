/** The result of reading a property whose getter or proxy trap may throw. */
export type ReadResult =
  { readonly ok: true; readonly value: unknown } | { readonly ok: false; readonly value?: never };
