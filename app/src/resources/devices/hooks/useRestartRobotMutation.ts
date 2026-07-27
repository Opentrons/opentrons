import { useDispatch } from 'react-redux'

import { useRestartMutation } from '@opentrons/react-api-client'

import { useRobot } from '/app/redux-resources/robots'
import { beginRobotRestartTracking } from '/app/redux/robot-admin/utils'

import type {
  DocumentationState,
  UseRestartMutationOptions,
  UseRestartMutationResult,
} from '@opentrons/react-api-client'
import type { Dispatch } from '/app/redux/types'

/**
 * Restart a robot and begin Redux restart-status tracking + discovery.
 */
export function useRestartRobotMutation(
  documentationState: DocumentationState,
  robotName: string,
  options: UseRestartMutationOptions = {}
): UseRestartMutationResult {
  const dispatch = useDispatch<Dispatch>()
  const robot = useRobot(robotName)

  return useRestartMutation(documentationState, {
    ...options,
    onSuccess: (data, variables, context) => {
      beginRobotRestartTracking(
        robotName,
        robot?.serverHealth?.bootId ?? null
      ).forEach(action => {
        dispatch(action)
      })
      options.onSuccess?.(data, variables, context)
    },
  })
}
