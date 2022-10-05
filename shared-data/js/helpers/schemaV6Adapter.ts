import type {
  LoadLabwareRunTimeCommand,
  LoadModuleRunTimeCommand,
} from '../../protocol/types/schemaV6/command/setup'
import type { RunTimeCommand, ProtocolAnalysisFile } from '../../protocol'
import type { PipetteName } from '../pipettes'
import type {
  PendingProtocolAnalysis,
  CompletedProtocolAnalysis,
  LabwareDefinition2,
  ModuleModel,
} from '../types'
// This adapter exists to resolve the interface mismatch between the PE analysis response
// and the protocol schema v6 interface. Much of this logic should be deleted once we resolve
// these discrepencies on the server side
const TRASH_ID = 'fixedTrash'

/**
 * @deprecated No longer necessary, do not use
 */
export const schemaV6Adapter = (
  protocolAnalysis: PendingProtocolAnalysis | CompletedProtocolAnalysis
): ProtocolAnalysisFile<{}> | null => {
  if (protocolAnalysis != null && protocolAnalysis.status === 'completed') {
    const pipettes: {
      [index: number]: {
        id: string
        pipetteName: PipetteName
      }
    } = protocolAnalysis.pipettes.reduce((acc, pipette, index) => {
      return {
        ...acc,
        [index]: {
          id: pipette.id,
          pipetteName: pipette.pipetteName,
        },
      }
    }, {})

    const labware: {
      [labwareId: string]: {
        definitionUri: string
        displayName?: string
      }
    } = protocolAnalysis.labware.reduce((acc, labware) => {
      const labwareId = labware.id
      if (labwareId === TRASH_ID) {
        return { ...acc }
      }
      const loadCommand: LoadLabwareRunTimeCommand | null =
        protocolAnalysis.commands.find(
          (command: RunTimeCommand): command is LoadLabwareRunTimeCommand =>
            command.commandType === 'loadLabware' &&
            command.result?.labwareId === labwareId
        ) ?? null
      const displayName: string | null = loadCommand?.params.displayName ?? null

      return {
        ...acc,
        [labwareId]: {
          definitionUri: labware.definitionUri,
          displayName: displayName,
        },
      }
    }, {})

    const labwareDefinitions: {
      [definitionUri: string]: LabwareDefinition2
    } = protocolAnalysis.commands
      .filter(
        (command: RunTimeCommand): command is LoadLabwareRunTimeCommand =>
          command.commandType === 'loadLabware'
      )
      .reduce((acc, command: LoadLabwareRunTimeCommand) => {
        const labwareDef: LabwareDefinition2 = command.result?.definition
        const labwareId = command.result?.labwareId ?? ''
        const definitionUri =
          protocolAnalysis.labware.find(labware => labware.id === labwareId)
            ?.definitionUri ?? ''

        return {
          ...acc,
          [definitionUri]: labwareDef,
        }
      }, {})

    const modules: {
      [moduleId: string]: { model: ModuleModel }
    } = protocolAnalysis.commands
      .filter(
        (command: RunTimeCommand): command is LoadModuleRunTimeCommand =>
          command.commandType === 'loadModule'
      )
      .reduce((acc, command: LoadModuleRunTimeCommand) => {
        const moduleId = command.result?.moduleId ?? ''
        const moduleModel = command.params.model

        return {
          ...acc,
          [moduleId]: { model: moduleModel },
        }
      }, {})

    const liquids: {
      [liquidId: string]: {
        displayName: string
        description: string
        displayColor?: string
      }
    } = protocolAnalysis.liquids?.reduce((acc, liquid) => {
      return {
        ...acc,
        [liquid.id]: {
          displayName: liquid.displayName,
          description: liquid.description,
          displayColor: liquid.displayColor,
        },
      }
    }, {})
    return {
      ...protocolAnalysis,
      //  @ts-expect-error
      pipettes,
      //  @ts-expect-error
      labware,
      modules,
      liquids,
      labwareDefinitions,
      commands: protocolAnalysis.commands,
    }
  }
  return null
}
