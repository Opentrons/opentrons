import type { RunTimeCommand } from '@opentrons/shared-data'
import type {
  LoadLabwareRunTimeCommand,
  LabwareLocation,
} from '@opentrons/shared-data/protocol/types/schemaV7/command/setup'

interface ModuleInitialLoadInfo {
  location: LabwareLocation
  protocolLoadOrder: number
}
export const getAdapterInitialLoadInfo = (
  labwareId: string,
  commands: RunTimeCommand[]
): ModuleInitialLoadInfo => {
  const labwareLoadIndex = commands.findIndex(
    (command: RunTimeCommand): command is LoadLabwareRunTimeCommand =>
      command.commandType === 'loadLabware' &&
      command.result?.labwareId === labwareId
  )

  if (labwareLoadIndex === -1) {
    throw new Error(
      'expected to be able to find labware location, but could not'
    )
  }

  const protocolLoadOrder = commands
    .slice(0, labwareLoadIndex)
    .reduce(
      (labwareLoadIndex, command) =>
        command.commandType === 'loadLabware'
          ? labwareLoadIndex + 1
          : labwareLoadIndex,
      0
    )

  return {
    location: (commands[labwareLoadIndex] as LoadLabwareRunTimeCommand).params
      .location,
    protocolLoadOrder,
  }
}
