import { useSelector } from 'react-redux'

import { getRobotUpdateDisplayInfo } from './selectors'

import type { State } from '../types'

// Whether the robot is on a different version of software than the current app.
export function useIsRobotOnWrongVersionOfSoftware(robotName: string): boolean {
  return ['upgrade', 'downgrade'].includes(
    useSelector((state: State) => getRobotUpdateDisplayInfo(state, robotName))
      ?.autoUpdateAction
  )
}
