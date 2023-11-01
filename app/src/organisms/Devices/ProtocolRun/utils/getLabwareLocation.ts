import type {
  LoadLabwareRunTimeCommand,
  LabwareLocation,
  RunTimeCommand,
} from '@opentrons/shared-data'

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
