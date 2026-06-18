import { useDispatch, useSelector } from 'react-redux'

import { clearRobotUpdateSession, startRobotUpdate } from './actions'
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
// NOTE: version gating is currently disabled; upload/run is allowed regardless
// of app-vs-robot version skew. To re-enable, restore the original return value.
export function useIsRobotOnWrongVersionOfSoftware(robotName: string): boolean {
  const autoUpdateAction = useSelector((state: State) =>
    getRobotUpdateDisplayInfo(state, robotName)
  )?.autoUpdateAction
  void autoUpdateAction
  return false
}
