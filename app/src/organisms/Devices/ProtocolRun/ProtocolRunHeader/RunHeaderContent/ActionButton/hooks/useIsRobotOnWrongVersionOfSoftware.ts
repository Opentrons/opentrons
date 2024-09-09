import { useSelector } from 'react-redux'
import type { State } from '../../../../../../../redux/types'
import { getRobotUpdateDisplayInfo } from '../../../../../../../redux/robot-update'

export function useIsRobotOnWrongVersionOfSoftware(robotName: string): boolean {
  return ['upgrade', 'downgrade'].includes(
    useSelector((state: State) => getRobotUpdateDisplayInfo(state, robotName))
      ?.autoUpdateAction
  )
}
