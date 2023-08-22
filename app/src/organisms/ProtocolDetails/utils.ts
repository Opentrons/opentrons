import {
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  OT2_STANDARD_MODEL,
  FLEX_STANDARD_MODEL,
} from '@opentrons/shared-data'

import type { RobotType } from '@opentrons/shared-data'

export function getSlotsForThermocycler(
  robotType: RobotType | null
): typeof TC_MODULE_LOCATION_OT2 | typeof TC_MODULE_LOCATION_OT3 {
  if (robotType === OT2_STANDARD_MODEL) return TC_MODULE_LOCATION_OT2
  if (robotType === FLEX_STANDARD_MODEL) return TC_MODULE_LOCATION_OT3
  // the protocol was analyzed before the robotType property was added to protocol data, this means it could only be for an OT-2
  return TC_MODULE_LOCATION_OT2
}
