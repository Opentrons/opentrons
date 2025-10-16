import { getLabwareSlot } from '@opentrons/step-generation'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { RobotState } from '@opentrons/step-generation'

export const getSlotIdFromCommand = (
  command?: RunTimeCommand,
  robotState?: RobotState,
  commands?: RunTimeCommand[],
  currentCommandIndex?: number
): string | null => {
  if (command == null) return null

  // For aspirateInPlace/dispenseInPlace, look for labwareId in previous moveToWell commands
  if (
    (command.commandType === 'aspirateInPlace' ||
      command.commandType === 'dispenseInPlace') &&
    commands != null &&
    currentCommandIndex != null
  ) {
    // Search backwards for the most recent moveToWell command with labwareId
    for (let i = currentCommandIndex - 1; i >= 0; i--) {
      const prevCommand = commands[i]
      if (
        prevCommand.commandType === 'moveToWell' &&
        'labwareId' in prevCommand.params &&
        prevCommand.params.labwareId != null
      ) {
        const labwareId = prevCommand.params.labwareId
        const slot = getLabwareSlot(labwareId, robotState?.labware ?? {})
        return slot !== '' ? slot : null
      }
    }
  }

  if ('labwareId' in command.params && command.params.labwareId != null) {
    const labwareId = command.params.labwareId
    const slot = getLabwareSlot(labwareId, robotState?.labware ?? {})
    return slot !== '' ? slot : null
  }

  if ('moduleId' in command.params && command.params.moduleId != null) {
    const moduleId = command.params.moduleId
    return robotState?.modules[moduleId]?.slot ?? null
  }

  if (command.commandType === 'moveLabware') {
    const { newLocation } = command.params
    if (typeof newLocation === 'string') {
      return newLocation
    }
    if ('slotName' in newLocation) {
      return newLocation.slotName
    }
    if ('moduleId' in newLocation) {
      return robotState?.modules[newLocation.moduleId]?.slot ?? null
    }
  }
  return null
}
