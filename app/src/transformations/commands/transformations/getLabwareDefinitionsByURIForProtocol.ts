import { getLabwareDefURI } from '@opentrons/shared-data'
import type {
  LabwareDefinition2,
  LoadLabwareRunTimeCommand,
  LoadLidRunTimeCommand,
  LoadLidStackRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'

export interface LabwareDefinitionsByURI {
  [labwareDefURI: string]: LabwareDefinition2
}

export function getLabwareDefinitionsByURIForProtocol(
  commands: RunTimeCommand[]
): LabwareDefinitionsByURI {
  return commands
    .filter((command): command is
      | LoadLabwareRunTimeCommand
      | LoadLidStackRunTimeCommand
      | LoadLidRunTimeCommand =>
      ['loadLabware', 'loadLidStack', 'loadLid'].includes(command.commandType)
    )
    .reduce<LabwareDefinitionsByURI>((acc, command) => {
      const definition = command.result?.definition
      if (definition == null) return acc
      const defURI = getLabwareDefURI(definition)
      if (Object.keys(acc).includes(defURI)) {
        return acc
      } else {
        return {
          ...acc,
          [defURI]: definition,
        }
      }
    }, {})
}
