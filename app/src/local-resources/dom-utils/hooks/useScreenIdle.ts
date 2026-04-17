import { useCallback, useEffect, useRef, useState } from 'react'

import { SLEEP_NEVER_MS } from '/app/local-resources/dom-utils'

import { useActivityListener } from './useActivityListener'

const USER_EVENTS: Array<keyof DocumentEventMap> = [
  'mousedown',
  'click',
  'scroll',
]

const DEFAULT_OPTIONS = {
  initialState: true,
}

/**
 * React hook to check user events
 *
 * @param {number} idleTime (idle time)
 * @param {object} options (initialState: initial state true => idle)
 * @returns {boolean}
 */
export function useScreenIdle(
  idleTime: number,
  options?: Partial<{
    initialState: boolean
  }>
): boolean {
  const { initialState } = { ...DEFAULT_OPTIONS, ...options }
  const [idle, setIdle] = useState<boolean>(initialState)
  const idleTimer = useRef<number>()

  const startOrResetTimer = useCallback(() => {
    if (idleTimer.current != null) {
      window.clearTimeout(idleTimer.current)
    }
    // See RQA-3813 and associated PR.
    if (idleTime !== SLEEP_NEVER_MS) {
      idleTimer.current = window.setTimeout(() => {
        setIdle(true)
      }, idleTime)
    }
  }, [idleTime])

  // Start the initial timer when we mount.
  // Clear any ongoing timer when we unmount.
  useEffect(() => {
    startOrResetTimer()
    return () => {
      if (idleTimer.current != null) {
        window.clearTimeout(idleTimer.current)
      }
    }
  }, [startOrResetTimer])

  // Reset the timer whenever there's user activity.
  const handleActivity = useCallback(() => {
    setIdle(false)
    startOrResetTimer()
  }, [startOrResetTimer])
  useActivityListener(handleActivity, USER_EVENTS)

  return idle
}
