import type { Command } from '@opentrons/shared-data'
import type {
  LoadLabwareCommand,
  LabwareLocation,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

const TRASH_ID = 'fixedTrash'

export const getLabwareLocation = (
  labwareId: string,
  commands: Command[]
): LabwareLocation => {
  if (labwareId === TRASH_ID) {
    return { slotName: '12' }
  }
  const labwareLocation = commands.find(
    (command: Command): command is LoadLabwareCommand =>
      command.commandType === 'loadLabware' &&
      command.result?.labwareId === labwareId
  )?.params?.location

  if (labwareLocation == null) {
    throw new Error(
      'expected to be able to find labware location, but could not'
    )
  }

  return labwareLocation
}
