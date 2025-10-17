import { getLabwareSlot } from '@opentrons/step-generation'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

export interface SlotIdAndDisplayName {
  slotId: string | null
  displayName: string | null
  labwareId: string | null
}

export const getSlotIdFromCommand = (
  command?: RunTimeCommand,
  robotState?: RobotState,
  commands?: RunTimeCommand[],
  currentCommandIndex?: number,
  invariantContext?: InvariantContext
): SlotIdAndDisplayName => {
  if (command == null) {
    return { slotId: null, displayName: null, labwareId: null }
  }

  const getLabwareInfo = (labwareId: string): SlotIdAndDisplayName => {
    const slot = getLabwareSlot(labwareId, robotState?.labware ?? {})
    const displayName =
      invariantContext?.labwareEntities[labwareId]?.def.metadata.displayName ??
      null
    return {
      slotId: slot !== '' ? slot : null,
      displayName,
      labwareId,
    }
  }

  if (
    (command.commandType === 'aspirateInPlace' ||
      command.commandType === 'dispenseInPlace') &&
    commands != null &&
    currentCommandIndex != null
  ) {
    for (let i = currentCommandIndex - 1; i >= 0; i--) {
      const prevCommand = commands[i]
      if (
        prevCommand.commandType === 'moveToWell' &&
        'labwareId' in prevCommand.params &&
        prevCommand.params.labwareId != null &&
        typeof prevCommand.params.labwareId === 'string'
      ) {
        return getLabwareInfo(prevCommand.params.labwareId as string)
      }
    }
  }

  if (
    'labwareId' in command.params &&
    command.params.labwareId != null &&
    typeof command.params.labwareId === 'string'
  ) {
    return getLabwareInfo(command.params.labwareId as string)
  }

  if ('moduleId' in command.params && command.params.moduleId != null) {
    const moduleId = command.params.moduleId
    const slotId = robotState?.modules[moduleId]?.slot ?? null
    return { slotId, displayName: null, labwareId: null }
  }

  if (command.commandType === 'moveLabware') {
    const { newLocation } = command.params
    if (typeof newLocation === 'string') {
      return { slotId: newLocation, displayName: null, labwareId: null }
    }
    if ('slotName' in newLocation) {
      return {
        slotId: newLocation.slotName,
        displayName: null,
        labwareId: null,
      }
    }
    if ('moduleId' in newLocation) {
      const slotId = robotState?.modules[newLocation.moduleId]?.slot ?? null
      return { slotId, displayName: null, labwareId: null }
    }
  }
  return { slotId: null, displayName: null, labwareId: null }
}
