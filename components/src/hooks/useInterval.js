// @flow
import { useEffect, useRef } from 'react'

/**
 * React hook to call a function on an interval; copied from:
 * https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 *
 * @template T (type of the input value)
 * @param {() => mixed} callback (function to call on an interval)
 * @param {number | null} callback (interval delay, or null to stop interval)
 * @returns {void}
 */
export function useInterval(callback: () => mixed, delay: number | null): void {
  const savedCallback = useRef()

  // remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // set up the interval
  useEffect(() => {
    const tick = () => savedCallback.current && savedCallback.current()
    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}
