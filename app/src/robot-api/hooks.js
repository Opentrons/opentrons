// @flow
// hooks for components that depend on API state
import { useRef, useEffect } from 'react'
import { usePrevious } from '@opentrons/components'

import type { RobotApiResponse, RobotApiRequestState } from './types'

export type Handlers = $Shape<{
  onFinish: (response: RobotApiResponse) => mixed,
}>

/**
 * React hook to trigger a Robot API action dispatch and call handlers through
 * the lifecycle of the triggered request
 *
 * @param {() => mixed} trigger (function that dispatches robot API request action)
 * @param {RobotApiRequestState | null} requestState (lifecycle state subtree for given robot and request)
 * @param {Handlers} [handlers={}] (lifecycle handlers)
 * @returns {() => void} (function that will call `trigger`)
 *
 * @example
 * import {useDispatch, useSelector} from 'react-redux'
 * import type {State} from '../../types'
 * import {fetchPiepttes, getPipettesRequestState} from '../../robot-api'
 *
 * type Props = { robot: Robot, goToNextScreen: () => mixed }
 *
 * function FetchPipettesButton(props: Props) {
 *   const { robot, goToNextScreen } = props
 *   const dispatch = useDispatch()
 *   const dispatchFetch = useCallback(() => {
 *     dispatch(fetchPipettes(props.robot))
 *   }, [robot])
 *   const requestState = useSelector(
 *    (state: State) => getPipettesRequestState(state, robot.name)
 *   )
 *   const triggerFetch = useTriggerRobotApiAction(
 *     dispatchFetch,
 *     requestState,
 *     { onFinish: props.proceed }
 *   )
 *
 *   return <button onClick={triggerFetch}>Check Pipettes</button>
 * }
 */
export function useTriggerRobotApiAction(
  trigger: () => mixed,
  requestState: RobotApiRequestState | null,
  handlers: Handlers = {}
): () => void {
  const hasFiredRef = useRef(false)
  const prevRequest = usePrevious(requestState)
  const { onFinish } = handlers

  useEffect(() => {
    const hasFired = hasFiredRef.current

    // hasFired ensures we actually triggered a request (as opposed to a
    // request to the same path triggering on a loop)
    if (hasFired) {
      const prevResponse = prevRequest?.response
      const nextResponse = requestState?.response

      // if prevResponse is null and nextResponse exists, fetch has finished
      if (!prevResponse && nextResponse) {
        hasFiredRef.current = false
        if (typeof onFinish === 'function') onFinish(nextResponse)
      }
    }
  }, [prevRequest, requestState, onFinish])

  return () => {
    hasFiredRef.current = true
    trigger()
  }
}
