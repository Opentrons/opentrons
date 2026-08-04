import { getLabwareDefURI } from '.'

import type {
  LabwareDefinition,
  LabwareDefinitionsByURI,
  RunTimeCommand,
} from '..'

export function getLoadedLabwareDefinitionsByUri(
  commands: RunTimeCommand[]
): LabwareDefinitionsByURI {
  return commands.reduce((acc, command) => {
    if (
      command.commandType === 'loadLabware' ||
      command.commandType === 'loadLid' ||
      command.commandType === 'loadLidStack'
    ) {
      const labwareDef: LabwareDefinition | undefined =
        command.result?.definition
      if (labwareDef == null) {
        if (command.commandType !== 'loadLidStack') {
          console.warn(
            `could not find a labware definition in the results of load labware command: ${JSON.stringify(
              command
            )}`
          )
        }
        return acc
      } else {
        const definitionUri = getLabwareDefURI(labwareDef)
        return { ...acc, [definitionUri]: labwareDef }
      }
    } else if (command.commandType === 'flexStacker/setStoredLabware') {
      const primaryLabwareDef = command.result?.primaryLabwareDefinition
      if (primaryLabwareDef == null) {
        console.warn(
          `could not find a labware definition in the results of set stored labware command: ${JSON.stringify(
            command
          )}`
        )
        return acc
      }
      const primaryDefinitionUri = getLabwareDefURI(primaryLabwareDef)
      let stackerLabware = { [primaryDefinitionUri]: primaryLabwareDef }
      if (command.result?.lidLabwareDefinition != null) {
        const lidDefUri = getLabwareDefURI(command.result.lidLabwareDefinition)
        stackerLabware = {
          ...stackerLabware,
          [lidDefUri]: command.result.lidLabwareDefinition,
        }
      }
      if (command.result?.adapterLabwareDefinition != null) {
        const adapterDefUri = getLabwareDefURI(
          command.result.adapterLabwareDefinition
        )
        stackerLabware = {
          ...stackerLabware,
          [adapterDefUri]: command.result.adapterLabwareDefinition,
        }
      }
      return { ...acc, ...stackerLabware }
    } else {
      return acc
    }
  }, {})
}
