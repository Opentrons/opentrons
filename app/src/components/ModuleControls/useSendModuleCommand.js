// @flow
import { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  sendModuleCommand as sendModuleCommandAction,
  type ModuleCommandRequest,
} from '../../robot-api'
import { getConnectedRobot } from '../../discovery'

import type { Dispatch } from '../../types'
import type { Robot } from '../../discovery'

/**
 * React hook to get a function bound to the current robot
 * that will send commands to it's connected modules.
 */
const useSendModuleCommand = () => {
  const robot: ?Robot = useSelector(getConnectedRobot)
  const dispatch = useDispatch<Dispatch>()
  const sendModuleCommand = useCallback(
    (serial: string, request: ModuleCommandRequest) => {
      if (!robot) {
        console.warn(
          'attempted to send module command with no connected robot present'
        )
      } else {
        dispatch(sendModuleCommandAction(robot, serial, request))
      }
    },
    [robot, dispatch]
  )
  return sendModuleCommand
}

export default useSendModuleCommand
