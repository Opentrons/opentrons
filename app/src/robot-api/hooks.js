// @flow
// hooks for components that depend on API state
import { useReducer, useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import uniqueId from 'lodash/uniqueId'

import type { State, Action } from '../types'
import { PENDING } from './constants'
import { getRequestById } from './selectors'
import type { RequestState } from './types'

/**
 * React hook to attach a unique request ID to and dispatch an API action
 * Note: dispatching will trigger a re-render of the component
 *
 * @returns {[action => mixed, Array<string>]} tuple of dispatch function and dispatched request IDs
 *
 * @example
 * import { useDispatchApiRequest } from '../../robot-api'
 * import { fetchPipettes } from '../../pipettes'
 *
 * type Props = {| robotName: string |}
 *
 * export function FetchPipettesButton(props: Props) {
 *   const { robotName } = props
 *   const [dispatch, requestIds] = useDispatchApiRequest()
 *
 *   return (
 *     <button onClick={() => dispatch(fetchPipettes(robotName))}>
 *       Check Pipettes
 *     </button>
 *   )
 * }
 */
export function useDispatchApiRequest<
  A: { ...Action, meta: { requestId: string } }
>(): [(A) => A, Array<string>] {
  const dispatch = useDispatch<(A) => void>()

  // TODO(mc, 2019-11-06): evaluate whether or not this can be a ref
  const [requestIds, addRequestId] = useReducer<Array<string>, string>(
    (ids, next) => [...ids, next],
    []
  )

  const dispatchApiRequest = useCallback(
    (a: A): A => {
      const requestId = uniqueId('robotApi_request_')
      const action = { ...a, meta: { ...a.meta, requestId } }

      addRequestId(requestId)
      dispatch(action)
      return action
    },
    [dispatch]
  )

  return [dispatchApiRequest, requestIds]
}

/**
 * React hook to attach a unique request ID to and sequentially
 * dispatch multiple API actions upon completion of the last request.
 * One optional parameter for function to be called with tracked action
 * upon dispatch of said action.
 * Note: dispatching will trigger a re-render of the component
 *
 * @returns {[action => mixed, Array<string>]} tuple of dispatch function and dispatched request IDs
 *
 * @example
 * import { useDispatchApiRequests } from '../../robot-api'
 * import { fetchPipettes } from '../../pipettes'
 * import { fetchModules } from '../../modules'
 *
 * type Props = {| robotName: string |}
 *
 * export function FetchPipettesButton(props: Props) {
 *   const { robotName } = props
 *   const [dispatchRequests, requestIds] = useDispatchApiRequests()
 *
 *   return (
 *     <button onClick={() => dispatchRequests([fetchPipettes(robotName), fetchModules(robotName)])}>
 *       Check Pipettes
 *     </button>
 *   )
 * }
 */
export function useDispatchApiRequests<
  A: { ...Action, meta: { requestId: string } }
>(
  onDispatchedRequest: (A => void) | null
): [(...Array<A>) => void, Array<string>] {
  const [dispatchRequest, requestIds] = useDispatchApiRequest()

  const trackedRequestId = useRef<string | null>(null)
  const [unrequestedQueue, setUnrequestedQueue] = useState<Array<A>>([])

  const trackedRequestIsPending =
    useSelector<State, RequestState | null>(state =>
      trackedRequestId.current
        ? getRequestById(state, trackedRequestId.current)
        : null
    )?.status === PENDING

  if (unrequestedQueue.length > 0 && !trackedRequestIsPending) {
    const action = dispatchRequest(unrequestedQueue[0])
    if (onDispatchedRequest) onDispatchedRequest(action)
    trackedRequestId.current = action.meta.requestId
    setUnrequestedQueue(unrequestedQueue.slice(1))
  }

  const dispatchApiRequests = (...a: Array<A>) => {
    setUnrequestedQueue([...unrequestedQueue, ...a])
  }

  return [dispatchApiRequests, requestIds]
}
