import { getSlotInLocationStack } from './misc'

import type { RobotState } from '../types'

// this function returns the slot a labware is in
export const getLabwareSlot = (
  labwareId: string,
  labware: RobotState['labware']
): string => {
  const stack = labware[labwareId]?.stack
  return stack != null ? getSlotInLocationStack(stack) : ''
}
