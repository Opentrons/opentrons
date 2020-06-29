// @flow
// hooks for components that depend on API state
import uniqueId from 'lodash/uniqueId'
import { useCallback, useReducer } from 'react'
import { useDispatch } from 'react-redux'

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
    (a: A) => {
      const requestId = uniqueId('robotApi_request_')
      const action = { ...a, meta: { ...a.meta, requestId } }

      addRequestId(requestId)
      dispatch(action)
    },
    [dispatch]
  )

  return [dispatchApiRequest, requestIds]
}
