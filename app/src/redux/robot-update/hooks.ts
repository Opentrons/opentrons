import { useDispatch, useSelector } from 'react-redux'
import { startRobotUpdate, clearRobotUpdateSession } from './actions'
import { getRobotUpdateDisplayInfo } from './selectors'

import type { Dispatch, State } from '../types'

type DispatchStartRobotUpdate = (
  robotName: string,
  systemFile?: string | undefined
) => void

// Safely start a robot update.
export function useDispatchStartRobotUpdate(): DispatchStartRobotUpdate {
  const dispatch = useDispatch<Dispatch>()

  function dispatchStartRobotUpdate(
    robotName: string,
    systemFile?: string
  ): void {
    dispatch(clearRobotUpdateSession())
    dispatch(startRobotUpdate(robotName, systemFile))
  }

  return dispatchStartRobotUpdate
}

// Whether the robot is on a different version of software than the current app.
export function useIsRobotOnWrongVersionOfSoftware(robotName: string): boolean {
  return ['upgrade', 'downgrade'].includes(
    useSelector((state: State) => getRobotUpdateDisplayInfo(state, robotName))
      ?.autoUpdateAction
  )
}
