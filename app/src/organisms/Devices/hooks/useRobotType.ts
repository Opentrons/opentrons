import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { useIsFlex } from './useIsFlex'
import type { RobotType } from '@opentrons/shared-data'

export function useRobotType(robotName: string): RobotType {
  const isFlex = useIsFlex(robotName)
  return isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE
}
