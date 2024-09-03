import { useEffect, useRef } from 'react'

/**
 * React hook to call a function after a delay; adapted from: useInterval
 *
 * @template T (type of the input value)
 * @param {() => unknown} callback (function to call after timeout)
 * @param {number | null} delay (timeout delay, or null to disable the timeout)
 * @returns {void}
 */
export function useTimeout(
  callback: () => unknown,
  delay: number | null
): void {
  const savedCallback = useRef<() => unknown>()

  // remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // set up the timeout
  useEffect(() => {
    const currentCallback = (): unknown =>
      savedCallback.current != null && savedCallback.current()
    if (delay !== null) {
      const id = setTimeout(currentCallback, delay)
      return () => {
        clearTimeout(id)
      }
    }
  }, [delay])
}
