import { getLabwareDefURI } from '.'
import type { RunTimeCommand, LabwareDefinition2 } from '..'

export function getLoadedLabwareDefinitionsByUri(
  commands: RunTimeCommand[]
): { [defURI: string]: LabwareDefinition2 } {
  return commands.reduce((acc, command) => {
    if (command.commandType === 'loadLabware') {
      const labwareDef: LabwareDefinition2 = command.result?.definition
      if (labwareDef == null) {
        console.error(
          `could not find a labware definition in the results of load labware command: ${JSON.stringify(
            command
          )}`
        )
        return acc
      } else {
        const definitionUri = getLabwareDefURI(labwareDef)
        return { ...acc, [definitionUri]: labwareDef }
      }
    } else {
      return acc
    }
  }, {})
}
