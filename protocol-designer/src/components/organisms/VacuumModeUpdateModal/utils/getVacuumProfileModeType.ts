import { PROFILE_STEP } from '/protocol-designer/form-types'

import type {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
} from '@opentrons/step-generation'
import type { VacuumProfileItem } from '/protocol-designer/form-types'

export const getVacuumProfileModeType = (
  profileItem: VacuumProfileItem
): typeof VACUUM_MODE_PRESSURE | typeof VACUUM_MODE_POWER => {
  if (profileItem.type === PROFILE_STEP) {
    return profileItem.pumpData.mode
  }
  const firstCycleStep =
    profileItem.profileStepItemsById[profileItem.orderedProfileStepIds[0]]
  return firstCycleStep.pumpData.mode
}
