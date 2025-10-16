import type { RunTimeCommand } from '@opentrons/shared-data'
import type { RobotState } from '@opentrons/step-generation'

export const getSlotIdFromCommand = (
  command: RunTimeCommand,
  robotState: RobotState
): string | null => {
  if (command == null) return null

  if ('labwareId' in command.params && command.params.labwareId != null) {
    const labwareId = command.params.labwareId
    return robotState.labware[labwareId]?.slot ?? null
  }

  if ('moduleId' in command.params && command.params.moduleId != null) {
    const moduleId = command.params.moduleId
    return robotState.modules[moduleId]?.slot ?? null
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
      return robotState.modules[newLocation.moduleId]?.slot ?? null
    }
  }
  return null
}
