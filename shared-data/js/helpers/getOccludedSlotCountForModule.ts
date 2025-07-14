import { OT2_ROBOT_TYPE, THERMOCYCLER_MODULE_TYPE } from '../constants'

import type { ModuleType, RobotType } from '../types'

export function getOccludedSlotCountForModule(
  moduleType: ModuleType,
  robotType: RobotType
): number {
  if (moduleType === THERMOCYCLER_MODULE_TYPE && robotType === OT2_ROBOT_TYPE) {
    return 4
  } else {
    return 1
  }
}
