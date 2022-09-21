import { getLabwareDefURI } from '@opentrons/shared-data'
import type { LabwareDefinition2, RunTimeCommand } from '@opentrons/shared-data'

export function getDefsByURIFromCommands(commands: RunTimeCommand[]): { [defURI: string]: LabwareDefinition2} {
  return commands.reduce((acc, command) => {
    if (command.commandType === 'loadLabware') {
      const labwareDef: LabwareDefinition2 = command.result?.definition
      const definitionUri = getLabwareDefURI(labwareDef)
      return { ...acc, [definitionUri]: labwareDef }
    } else {
      return acc
    }
  }, {})
}
