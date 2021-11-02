import type { Command } from '@opentrons/shared-data'
import type { LoadLabwareCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

export const getLabwareLocation = (
  labwareId: string,
  commands: Command[]
): string => {
  const labwareLocation = commands.find(
    (command: Command): command is LoadLabwareCommand =>
      command.commandType === 'loadLabware' &&
      command.params.labwareId === labwareId
  )?.params.location

  if (labwareLocation == null) {
    throw new Error(
      'expected to be able to find labware location, but could not'
    )
  }

  return 'slotName' in labwareLocation
    ? labwareLocation.slotName
    : labwareLocation.moduleId
}
