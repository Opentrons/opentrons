import { OT2_ROBOT_TYPE, THERMOCYCLER_MODULE_TYPE } from '..'
import type { ModuleType, RobotType } from '..'

export function getOccludedSlotCountForModule(
  moduleType: ModuleType,
  robotType: RobotType
): number {
  if (moduleType === THERMOCYCLER_MODULE_TYPE) {
    return robotType === OT2_ROBOT_TYPE ? 4 : 2
  } else {
    return 1
  }
}
