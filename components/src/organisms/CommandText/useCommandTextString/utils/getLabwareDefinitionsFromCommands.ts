import { getLabwareDefURI } from '@opentrons/shared-data'

import type {
  LabwareDefinition,
  LoadLabwareRunTimeCommand,
  LoadLidRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'

// Note: This is an O(n) operation.
export function getLabwareDefinitionsFromCommands(
  commands: RunTimeCommand[]
): LabwareDefinition[] {
  return commands.reduce<LabwareDefinition[]>(
    (acc, command) => [
      ...getLabwareDefinitionFromCommand(command, acc),
      ...acc,
    ],
    []
  )
}

function getNewLabwareDefinitions(
  newDefinitions: Array<LabwareDefinition | null | undefined>,
  knownDefinitions: LabwareDefinition[]
): LabwareDefinition[] {
  return newDefinitions.filter(
    (maybeNewDef): maybeNewDef is LabwareDefinition =>
      maybeNewDef != null &&
      !knownDefinitions.some(
        knownDef => getLabwareDefURI(knownDef) === getLabwareDefURI(maybeNewDef)
      )
  )
}

const isLoadCommand = (
  command: RunTimeCommand
): command is LoadLabwareRunTimeCommand | LoadLidRunTimeCommand =>
  ['loadLabware', 'loadLid', 'loadLidStack'].includes(command.commandType)

function getLabwareDefinitionFromCommand(
  command: RunTimeCommand,
  known: LabwareDefinition[]
): LabwareDefinition[] {
  if (isLoadCommand(command)) {
    return getNewLabwareDefinitions([command.result?.definition], known)
  }
  if (command.commandType === 'flexStacker/setStoredLabware') {
    return getNewLabwareDefinitions(
      [
        command.result?.primaryLabwareDefinition,
        command.result?.adapterLabwareDefinition,
        command.result?.lidLabwareDefinition,
      ],
      known
    )
  }
  return []
}
