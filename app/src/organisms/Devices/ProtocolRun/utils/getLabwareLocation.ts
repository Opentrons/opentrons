import type { RunTimeCommand } from '@opentrons/shared-data'
import type {
  LoadLabwareRunTimeCommand,
  LabwareLocation,
} from '@opentrons/shared-data/protocol/types/schemaV7/command/setup'

const TRASH_ID = 'fixedTrash'

/**
 * @deprecated use `getInitialLabwareLocation` instead
 */
export const getLabwareLocation = (
  labwareId: string,
  commands: RunTimeCommand[]
): LabwareLocation => {
  if (labwareId === TRASH_ID) {
    return { slotName: '12' }
  }
  const labwareLocation = commands.find(
    (command: RunTimeCommand): command is LoadLabwareRunTimeCommand =>
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
