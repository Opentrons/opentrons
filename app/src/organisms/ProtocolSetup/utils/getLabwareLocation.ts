import type { Command } from '@opentrons/shared-data'
import type { LoadModuleCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

// Note: this can either return a slotName or a moduleId as per schema v6
export const getLabwareLocation = (
  moduleId: string,
  commands: Command[]
): string => {
  const labwareLocation = commands.find(
    (command: Command): command is LoadModuleCommand =>
      command.commandType === 'loadModule' &&
      command.params.moduleId === moduleId
  )?.params.location

  if (labwareLocation == null) {
    throw new Error(
      'expected to be able to find module location, but could not'
    )
  }

  return labwareLocation.slotName
}
