import { useSelector } from 'react-redux'

import { useRobotUpdateContext } from '/app/resources/robot-update/RobotUpdateContext'

import { getRobotUpdateDisplayInfo } from './selectors'

import type { State } from '../types'

type DispatchStartRobotUpdate = (
  robotName: string,
  systemFile?: string | undefined
) => void

// Safely start a robot update.
export function useDispatchStartRobotUpdate(): DispatchStartRobotUpdate {
  const { startUpdate } = useRobotUpdateContext()

  return startUpdate
}

// Whether the robot is on a different version of software than the current app.
export function useIsRobotOnWrongVersionOfSoftware(robotName: string): boolean {
  return ['upgrade', 'downgrade'].includes(
    useSelector((state: State) => getRobotUpdateDisplayInfo(state, robotName))
      ?.autoUpdateAction
  )
}
