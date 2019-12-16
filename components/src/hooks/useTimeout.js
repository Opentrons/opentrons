// @flow
import { useEffect, useRef } from 'react'

/**
 * React hook to call a function on an interval; copied from:
 * https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 *
 * @template T (type of the input value)
 * @param {() => mixed} callback (function to call after timeout)
 * @param {number | null} delay (timeout delay, or null to disable the timeout)
 * @returns {void}
 */
export function useTimeout(callback: () => mixed, delay: number | null): void {
  const savedCallback = useRef()

  // remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // set up the interval
  useEffect(() => {
    const currentCallback = () =>
      savedCallback.current && savedCallback.current()
    if (delay !== null) {
      const id = setTimeout(currentCallback, delay)
      return () => clearTimeout(id)
    }
  }, [delay])
}
