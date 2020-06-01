// @flow
import { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { sendModuleCommand } from './actions'
import { getConnectedRobotName } from '../robot/selectors'
import { useLogger } from '../logger'

import type { Dispatch } from '../types'
import type { ModuleCommand } from './types'

/**
 * React hook to get a function bound to the current robot
 * that will send commands to its connected modules.
 */
export const useSendModuleCommand = (): ((
  moduleId: string,
  command: ModuleCommand,
  args?: Array<mixed>
) => void) => {
  const robotName = useSelector(getConnectedRobotName)
  const dispatch = useDispatch<Dispatch>()
  const log = useLogger(__dirname)

  return useCallback(
    (moduleId: string, command: ModuleCommand, args?: Array<mixed>) => {
      if (robotName !== null) {
        dispatch(sendModuleCommand(robotName, moduleId, command, args))
      } else {
        log.warn('cannot send module command with no connected robot', {
          moduleId,
          command,
          args,
        })
      }
    },
    [robotName, dispatch, log]
  )
}
