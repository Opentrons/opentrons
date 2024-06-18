import type { LabwareDefinition2, RunTimeCommand } from '@opentrons/shared-data'
import { getLabwareDefURI } from '@opentrons/shared-data'

export function getLabwareDefinitionsFromCommands(
  commands: RunTimeCommand[]
): LabwareDefinition2[] {
  return commands.reduce<LabwareDefinition2[]>((acc, command) => {
    const isLoadingNewDef =
      command.commandType === 'loadLabware' &&
      !acc.some(
        def =>
          command.result?.definition != null &&
          getLabwareDefURI(def) === getLabwareDefURI(command.result?.definition)
      )

    return isLoadingNewDef && command.result?.definition != null
      ? [...acc, command.result?.definition]
      : acc
  }, [])
}
