import { getLabwareDefURI } from './getLabwareDefURI'

import type {
  FlexStackerSetStoredLabwareRunTimeCommand,
  LoadLabwareRunTimeCommand,
  LoadLidRunTimeCommand,
  LoadLidStackRunTimeCommand,
  RunTimeCommand,
} from '../../protocol'
import type { LabwareDefinition } from '../types'

export interface LabwareDefinitionsByURI {
  [labwareDefURI: string]: LabwareDefinition
}

const defPair = (
  maybeDef?: LabwareDefinition
): Record<string, LabwareDefinition> =>
  maybeDef == null ? {} : { [getLabwareDefURI(maybeDef)]: maybeDef }

export function getLabwareDefinitionsByURIForProtocol(
  commands: RunTimeCommand[]
): LabwareDefinitionsByURI {
  const stackerLabware = commands
    .filter(
      (command): command is FlexStackerSetStoredLabwareRunTimeCommand =>
        command.commandType === 'flexStacker/setStoredLabware'
    )
    .reduce<LabwareDefinitionsByURI>((acc, command) => {
      return {
        ...acc,
        ...defPair(command.result?.primaryLabwareDefinition),
        ...defPair(command.result?.lidLabwareDefinition ?? undefined),
        ...defPair(command.result?.adapterLabwareDefinition ?? undefined),
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
