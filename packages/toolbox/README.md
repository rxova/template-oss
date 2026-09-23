# @rxova/toolbox

Small runtime helpers with no dependencies, shared by the rxova packages. They work in browsers and
in Node, have no side effects, and are built to es2020, so a bundler can inline the few you use.

```sh
pnpm add -D @rxova/toolbox
```

Add it as a **dev** dependency of a published package and let the build inline it. That way the
package keeps its zero-dependency promise and its size budget.

```ts
import { errorMessage, isRecord } from '@rxova/toolbox';
import { useIsomorphicLayoutEffect } from '@rxova/toolbox/react';
```

## `@rxova/toolbox`

| Export                                  | What it answers                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `isObjectLike(value)`                   | Any non-null object, arrays included.                                                    |
| `isRecord(value)`                       | A non-null, non-array object.                                                            |
| `isPlainObject(value)`                  | An object literal, `JSON.parse` result or `Object.create(null)` bag.                     |
| `tryRead(value, key)`                   | `{ ok, value }` for a read whose getter or proxy trap may throw.                         |
| `readProperty(value, key)`              | The property, or `undefined` when reading it throws.                                     |
| `readString(value, key)`                | The property when it is a string, else `undefined`.                                      |
| `hasProperty(value, key)`               | `key in value`, `false` when a proxy refuses.                                            |
| `safeKeys(value)`                       | `Object.keys`, `[]` when a proxy refuses.                                                |
| `isInstanceOf(value, Class)`            | `instanceof`, `false` when `Symbol.hasInstance` throws.                                  |
| `objectTag(value)`                      | `'[object Map]'` and friends, across realms.                                             |
| `arrayItems(value)`                     | A copy of an array, else `undefined`.                                                    |
| `isError(value)`                        | A real `Error`, from this realm or another. `{ message }` alone does not count.          |
| `errorMessage(value)`                   | The text to show for anything thrown. Never throws.                                      |
| `shallowEqual(a, b)`                    | `Object.is` for each own key. `{ a: undefined }` is not equal to `{ b: undefined }`.     |
| `isDevelopment()`                       | A boolean `__DEV__` wins; otherwise `NODE_ENV !== 'production'`.                         |
| `createDevWarner({ prefix, docsUrl? })` | `warn`, `warnOnce(key, …)` and `reset` for one package's development warnings.           |
| `canUseDOM()`                           | Whether both `window` and `document` exist.                                              |
| `deepFreeze(value)`                     | Freezes the value and everything reachable from it. Skips typed arrays, survives cycles. |
| `clamp(value, min, max)`                | `value` kept within `[min, max]`. NaN stays NaN; a reversed range throws.                |

## `@rxova/toolbox/react`

| Export                      | What it is                                                             |
| --------------------------- | ---------------------------------------------------------------------- |
| `useIsomorphicLayoutEffect` | `useLayoutEffect` when a `document` exists, `useEffect` on the server. |

`react` is an optional peer dependency. Only this entry point imports it.

## Notes

- **Dead-code elimination.** `isDevelopment` reads `process.env.NODE_ENV` literally, so a bundler
  can replace it. To drop a warning's text from a production bundle, guard the call site itself
  with `if (process.env.NODE_ENV !== 'production')`.
- **`isRecord` rejects arrays.** Code that meant "any object" should use `isObjectLike`.

## License

MIT
