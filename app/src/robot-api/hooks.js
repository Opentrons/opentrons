// @flow
// hooks for components that depend on API state
import { useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'

import type { State } from '../types'
import type { RobotApiResponse, RobotApiRequestState } from './types'

export type Handlers = $Shape<{
  onStart: () => mixed,
  onFinish: (response: RobotApiResponse) => mixed,
}>

export function useTriggerRobotApiAction(
  trigger: () => mixed,
  getRequestState: State => RobotApiRequestState | null,
  handlers: Handlers = {}
): () => void {
  const hasFiredRef = useRef(false)
  const prevRequestRef = useRef<RobotApiRequestState | null>(null)
  const nextRequest = useSelector(getRequestState)
  const { onStart, onFinish } = handlers

  useEffect(() => {
    const prevResponse = prevRequestRef.current?.response
    const nextResponse = nextRequest?.response
    const hasFired = hasFiredRef.current

    // hasFired ensures we actually triggered a request (as opposed to a
    // request to the same path triggering on a loop)
    if (hasFired) {
      // if prevResponse is null and nextResponse exists, fetch has finished
      if (!prevResponse && nextResponse) {
        hasFiredRef.current = false
        if (typeof onFinish === 'function') onFinish(nextResponse)
      }

      prevRequestRef.current = nextRequest
    }
  }, [nextRequest, onFinish])

  return () => {
    hasFiredRef.current = true
    prevRequestRef.current = null
    trigger()
    if (typeof onStart === 'function') onStart()
  }
}
