import { useCallback, useMemo, useRef } from 'react'

export interface Throttler {
  /**
   * Call toCall if it's been long enough since the last time. Otherwise, no-op.
   */
  maybeCall: (toCall: () => void) => void
}

/**
 * Limits how frequently a function is called.
 *
 * The advantage of using this over Lodash's throttle() or debounce() is that with
 * this, you can change the function being throttled without resetting the timer.
 * This tends to play more nicely with React, where our functions have to change
 * frequently because they're closures over changing state.
 */
export function useThrottler(throttleMS: number): Throttler {
  const lastCalledAt = useRef<number | null>(null)

  const maybeCall: Throttler['maybeCall'] = useCallback(
    toCall => {
      // performance.now() instead of Date.now() for monotonicity.
      const now = performance.now()
      if (
        lastCalledAt.current == null ||
        now - lastCalledAt.current > throttleMS
      ) {
        lastCalledAt.current = now
        toCall()
      }
    },
    [throttleMS]
  )

  const result: Throttler = useMemo(() => ({ maybeCall }), [maybeCall])
  return result
}
