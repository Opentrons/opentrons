import { useSelector } from 'react-redux'

import {
  getRobotUpdateDisplayInfo,
  isRobotSoftwareUpdateAvailable,
} from './selectors'

import type { State } from '../types'

// Whether the robot is on a different version of software than the current app.
export function useIsRobotOnWrongVersionOfSoftware(robotName: string): boolean {
  return isRobotSoftwareUpdateAvailable(
    useSelector((state: State) => getRobotUpdateDisplayInfo(state, robotName))
      .autoUpdateAction
  )
}
