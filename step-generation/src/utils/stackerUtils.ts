import { LabwareLocation, locationIsOnModule } from '@opentrons/shared-data'
import { TimelineFrame } from '../types'
import { getSlotInLocationStack } from '../utils'

// write tests for module section
export function getIsSlotOccupied(
  robotState: TimelineFrame,
  slotIpnut: LabwareLocation
) {
  console.log('robotState: ', robotState)
  console.log('slot: ', slotIpnut)
  for (const labware of Object.values(robotState.labware)) {
    if (labware.stack.length > 0) {
      const slot = getSlotInLocationStack(labware.stack)
      console.log('slot: ', slot)
      if (slot === slotIpnut) {
        return true
      }
    }
  }
  const isModuleOnSlot = locationIsOnModule(slotIpnut)
  console.log('isModuleOnSlot: ', isModuleOnSlot)
  // should check if the slot is occupied by a module
  for (const module of Object.values(robotState.modules)) {
    if (module.slot === slotIpnut) {
      return true;
    }
  }
  return false;
}
