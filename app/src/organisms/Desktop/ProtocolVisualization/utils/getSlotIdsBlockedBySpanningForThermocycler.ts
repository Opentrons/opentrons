import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import type { RobotType } from '@opentrons/shared-data'
import type {
  DeckSlot,
  ModuleEntities,
  RobotState,
} from '@opentrons/step-generation'

export const getSlotIdsBlockedBySpanningForThermocycler = (
  modules: RobotState['modules'],
  moduleEntities: ModuleEntities,
  robotType: RobotType
): DeckSlot[] => {
  const loadedThermocycler = Object.keys(modules).find(
    id => moduleEntities[id].type === THERMOCYCLER_MODULE_TYPE
  )
  if (loadedThermocycler != null && robotType === FLEX_ROBOT_TYPE) {
    return ['A1', 'B1']
  } else if (loadedThermocycler != null && robotType === OT2_ROBOT_TYPE) {
    return ['7', '8', '10', '11']
  }

  return []
}
