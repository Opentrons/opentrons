// @flow
// hooks for components that depend on API state
import { useReducer, useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getRequestById } from './selectors'
import uniqueId from 'lodash/uniqueId'
import last from 'lodash/last'
import { PENDING } from './constants'

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
export function useDispatchApiRequest<A: { meta: { requestId: string } }>(): [
  (A) => void,
  Array<string>
] {
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
 *   const [dispatchRequests, requestIds] = useDispatchApiRequest()
 *
 *   return (
 *     <button onClick={() => dispatchRequest([fetchPipettes(robotName), fetchModules(robotName)])}>
 *       Check Pipettes
 *     </button>
 *   )
 * }
 */
export function useDispatchApiRequests<
  A: Array<{ meta: { requestId: string } }>
>(onDispatch: A => void = null): [(A) => void, Array<string>] {
  const [dispatchRequest, requestIds] = useDispatchApiRequest()

  const trackedRequestId = useRef<string | null>(null)
  const unrequestedQueue = useRef<Array<A>>([])

  const trackedRequestIsPending =
    useSelector<State, RequestState | null>(state =>
      getRequestById(state, trackedRequestId)
    )?.status === PENDING

  if (!trackedRequestIsPending && unrequestedQueue.current.length > 0) {
    const action = dispatchRequest(unrequestedQueue.current[0])
    if (onDispatch) onDispatch(action)
    trackedRequestId.current = action.meta.requestId
    unrequestedQueue.current = unrequestedQueue.current.slice(1) // dequeue
  }

  const dispatchApiRequests = (...a: Array<A>) => {
    console.log('called', a)
    unrequestedQueue.current = a
  }

  return [dispatchApiRequests, requestIds]
}
