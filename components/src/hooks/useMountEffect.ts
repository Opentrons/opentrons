import { useEffect } from 'react'

import type { EffectCallback } from 'react'

/**
 * React hook to call a function on component mount and unmount
 *
 * @param {EffectCallback} callback (function to call on mount that optionally returns a cleanup function to call on unmount)
 * @returns {void}
 */
export function useMountEffect(callback: EffectCallback): void {
  // call useEffect with an empty dependency list so it's only called on mount
  // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(callback, [])
}
