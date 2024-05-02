import reduce from 'lodash/reduce'
import type {
  LoadLabwareRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'

export interface LoadedLabwareByAdapter {
  [labwareId: string]: LoadLabwareRunTimeCommand
}
export function getInitialLoadedLabwareByAdapter(
  commands: RunTimeCommand[]
): LoadedLabwareByAdapter {
  const loadLabwareCommandsReversed = commands
    .filter(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware'
    )
    .reverse()
  return reduce<LoadLabwareRunTimeCommand, LoadedLabwareByAdapter>(
    loadLabwareCommandsReversed,
    (acc, command) => {
      if (
        typeof command.params.location === 'object' &&
        'labwareId' in command.params.location
      ) {
        return { ...acc, [command.params.location.labwareId]: command }
      } else {
        return acc
      }
    },
    {}
  )
}
