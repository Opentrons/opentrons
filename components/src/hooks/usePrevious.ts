import { useEffect, useRef } from 'react'

/**
 * React hook to keep track of the previous value of a parameter
 * https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
 *
 * @template T (type of the input value)
 * @param {T} value (value to keep track of)
 * @returns {(T | void)} (previous value or undefined if first render)
 */
export function usePrevious<T>(value: T): T | undefined {
  const prevRef = useRef<T | undefined>()

  useEffect(() => {
    prevRef.current = value
  }, [value])

  return prevRef.current
}
