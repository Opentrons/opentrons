// @flow
import { useEffect } from 'react'

/**
 * React hook to call a function on component mount
 *
 * @param {() => mixed} callback (function to call on mount)
 * @returns {void}
 */
export function useMountEffect(callback: () => void | (() => void)): void {
  // call useEffect with an empty dependency list so it's only called on mount
  useEffect(callback, [])
}
