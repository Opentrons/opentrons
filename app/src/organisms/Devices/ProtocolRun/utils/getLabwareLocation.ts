import type { RunTimeCommand } from '@opentrons/shared-data'
import type {
  LoadLabwareRunTimeCommand,
  LoadAdapterRunTimeCommand,
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

  const locationCommand = commands.find(
    (
      command
    ): command is LoadLabwareRunTimeCommand | LoadAdapterRunTimeCommand =>
      (command.commandType === 'loadLabware' &&
        command.result?.labwareId === labwareId) ||
      (command.commandType === 'loadAdapter' &&
        command.result?.adapterId === labwareId)
  )

  if (locationCommand?.params?.location == null) {
    throw new Error(
      'Expected to be able to find labware location, but could not'
    )
  }

  return locationCommand.params.location
}
