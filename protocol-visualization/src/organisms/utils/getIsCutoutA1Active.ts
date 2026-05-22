import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { getActiveLayer } from './getActiveLayer'

import type { CutoutId, RunTimeCommand } from '@opentrons/shared-data'
import type { RobotState } from '@opentrons/step-generation'

export const getIsCutoutA1Active = (
  labware: RobotState['labware'],
  modules: RobotState['modules'],
  pipettes: RobotState['pipettes'],
  cutoutId: CutoutId,
  selectedRunTimeCommand?: RunTimeCommand
): boolean => {
  const labwareOnB1 = Object.entries(labware).find(
    ([_, lw]) => getSlotInLocationStack(lw.stack) === 'B1'
  )
  const hasThermocycler = Object.values(modules).some(
    module => module.moduleState.type === THERMOCYCLER_MODULE_TYPE
  )

  const { isActiveLayerVisible: isThermocyclerActive } =
    labwareOnB1 != null
      ? getActiveLayer(labwareOnB1[0], pipettes, selectedRunTimeCommand)
      : { isActiveLayerVisible: false }

  return isThermocyclerActive && hasThermocycler && cutoutId === 'cutoutA1'
}
