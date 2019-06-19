// @flow
// hooks for components that depend on API state
import { useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import type { State, Dispatch } from '../types'
import type {
  RobotApiAction,
  RobotApiResponse,
  RobotApiRequestState,
} from './types'

export function useDispatchRobotApiAction(
  action: RobotApiAction,
  onDone?: (response: RobotApiResponse) => mixed
): () => void {
  const { host, path } = action.payload
  const dispatch = useDispatch<Dispatch>()
  const firedRef = useRef(false)
  const prevRequestRef = useRef<RobotApiRequestState | null>(null)
  const nextRequest = useSelector<State, RobotApiRequestState | null>(
    state => state.robotApi[host.name]?.networking[path] || null
  )

  useEffect(() => {
    const prevResponse = prevRequestRef.current?.response
    const nextResponse = nextRequest?.response
    const hasFired = firedRef.current

    // hasFired ensures we actually triggered a request (as opposed to a
    // request to the same path triggering on a loop)
    if (hasFired) {
      // if prevResponse is null and nextResponse exists, fetch has finished
      if (!prevResponse && nextResponse) {
        firedRef.current = false
        if (typeof onDone === 'function') onDone(nextResponse)
      }

      prevRequestRef.current = nextRequest
    }
  }, [nextRequest, onDone])

  return () => {
    firedRef.current = true
    prevRequestRef.current = null
    dispatch(action)
  }
}
