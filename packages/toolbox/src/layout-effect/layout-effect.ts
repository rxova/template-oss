/**
 * `useLayoutEffect` where there is a document, `useEffect` where there is not.
 *
 * Work that has to land before paint — restoring a caret, measuring a node —
 * needs the layout effect in the browser. On the server there is no layout,
 * and React warns about every `useLayoutEffect` it renders, so the server gets
 * the effect that never runs there. Decided once, at import, because a hook
 * must be the same function on every render.
 */
import { useEffect, useLayoutEffect } from 'react';

export const useIsomorphicLayoutEffect =
  typeof document === 'undefined' ? useEffect : useLayoutEffect;
