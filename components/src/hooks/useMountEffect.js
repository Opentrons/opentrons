// @flow
import { useEffect } from 'react'

/**
 * React hook to call a function on component mount and unmount
 *
 * @param {() => void | (() => void)} callback (function to call on mount that optionally returns a cleanup function to call on unmount)
 * @returns {void}
 */
export function useMountEffect(callback: () => void | (() => void)): void {
  // call useEffect with an empty dependency list so it's only called on mount
  useEffect(callback, [])
}
