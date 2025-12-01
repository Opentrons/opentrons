import values from 'lodash/values'

import { getSlotInLocationStack } from '@opentrons/step-generation'

import type { RobotState } from '@opentrons/step-generation'

export const getSlotIsEmpty = (
  robotState: RobotState,
  slot: string
): boolean => {
  const modulesInSlot = values(robotState.modules).filter(
    moduleTemporalProperties => {
      return slot.includes(moduleTemporalProperties.slot)
    }
  )
  const labwareInSlot = values(robotState.labware).filter(
    labwareTemporalProperties =>
      getSlotInLocationStack(labwareTemporalProperties.stack) === slot
  )

  return modulesInSlot.length === 0 && labwareInSlot.length === 0
}
