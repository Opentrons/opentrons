import { getLabwareDefURI } from '@opentrons/shared-data'

import type {
  FlexStackerSetStoredLabwareRunTimeCommand,
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
  const stackerLabware = commands
    .filter(
      (command): command is FlexStackerSetStoredLabwareRunTimeCommand =>
        command.commandType === 'flexStacker/setStoredLabware'
    )
    .reduce<LabwareDefinitionsByURI>((acc, command) => {
      const labwareDefMap: LabwareDefinitionsByURI = {}
      const primaryLabwareDefinition = command.result?.primaryLabwareDefinition
      const lidLabwareDefinition = command.result?.lidLabwareDefinition
      const adapterLabwareDefinition = command.result?.adapterLabwareDefinition
      if (primaryLabwareDefinition == null) return acc
      const primaryDefUri = getLabwareDefURI(primaryLabwareDefinition)
      if (!Object.keys(acc).includes(primaryDefUri)) {
        labwareDefMap.primaryDefUri = primaryLabwareDefinition
      }
      if (lidLabwareDefinition != null) {
        const lidDefUri = getLabwareDefURI(lidLabwareDefinition)
        if (!Object.keys(acc).includes(lidDefUri)) {
          labwareDefMap.lidDefUri = lidLabwareDefinition
        }
      }
      if (adapterLabwareDefinition != null) {
        const adapterDefUri = getLabwareDefURI(adapterLabwareDefinition)
        if (!Object.keys(acc).includes(adapterDefUri)) {
          labwareDefMap.adapterDefUri = adapterLabwareDefinition
        }
      }
      return {
        ...acc,
        ...labwareDefMap,
      }
    }, {})
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
    }, stackerLabware)
}
