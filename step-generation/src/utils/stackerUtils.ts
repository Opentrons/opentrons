import { locationIsOnModule } from '@opentrons/shared-data'

import { getSlotInLocationStack } from '../utils'

import type { LabwareLocation } from '@opentrons/shared-data'
import type { TimelineFrame } from '../types'

// remove if not used write tests for module section
export const getIsSlotOccupied = (
  robotState: TimelineFrame,
  slotIpnut: LabwareLocation
): boolean => {
  console.log('robotState: ', robotState)
  console.log('slotIpnut: ', slotIpnut)
  for (const labware of Object.values(robotState.labware)) {
    if (labware.stack.length > 0) {
      const slot = getSlotInLocationStack(labware.stack)
      console.log('slot: ', slot)
      if ('slotName' in slotIpnut && slot === slotIpnut.slotName) {
        return true
      }
    }
  }
  const isModuleOnSlot = locationIsOnModule(slotIpnut)
  console.log('isModuleOnSlot: ', isModuleOnSlot)
  // should check if the slot is occupied by a module
  for (const module of Object.values(robotState.modules)) {
    if (module.slot === slotIpnut) {
      return true
    }
  }
  return false
}
