import { TimelineFrame } from "../types"
import { getSlotInLocationStack } from "../utils"

export function getIsSlotOccupied(robotState: TimelineFrame, slotIpnut: string) {
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
    console.log('in between')
    console.log('modules: ', robotState.modules)
    for (const module of Object.values(robotState.modules)) {
        console.log('module: ', module)
      if (module.slot === slotIpnut) {
        return true
      }
    }
    return false
  }