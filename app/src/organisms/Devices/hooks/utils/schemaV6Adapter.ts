import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
  ModuleModel,
  PendingProtocolAnalysis,
  PipetteName,
  ProtocolAnalysisFile,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  LoadLabwareRunTimeCommand,
  LoadModuleRunTimeCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

// TODO(sh, 2022-09-29): The liquids logic should move into the shared-data/schemaV6Adapter once the liquids FF is removed

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
      [pipetteId: string]: { name: PipetteName }
    } = protocolAnalysis.pipettes.reduce((acc, pipette) => {
      return {
        ...acc,
        [pipette.id]: {
          name: pipette.pipetteName,
        },
      }
    }, {})

    const labware: {
      [labwareId: string]: {
        definitionId: string
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
          definitionId: `${labware.definitionUri}_id`,
          displayName: displayName,
        },
      }
    }, {})

    const labwareDefinitions: {
      [definitionId: string]: LabwareDefinition2
    } = protocolAnalysis.commands
      .filter(
        (command: RunTimeCommand): command is LoadLabwareRunTimeCommand =>
          command.commandType === 'loadLabware'
      )
      .reduce((acc, command: LoadLabwareRunTimeCommand) => {
        const labwareDef: LabwareDefinition2 = command.result?.definition
        const labwareId = command.result?.labwareId ?? ''
        const definitionUri = protocolAnalysis.labware.find(
          labware => labware.id === labwareId
        )?.definitionUri
        const definitionId = `${definitionUri}_id`

        return {
          ...acc,
          [definitionId]: labwareDef,
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
    } = (protocolAnalysis?.liquids ?? []).reduce((acc, liquid) => {
      return {
        ...acc,
        [liquid.id]: {
          displayName: liquid.displayName,
          description: liquid.description,
          displayColor: liquid.displayColor,
        },
      }
    }, {})

    // @ts-expect-error this is a v6 like object that does not quite match the v6 spec at the moment
    return {
      ...protocolAnalysis,
      pipettes,
      labware,
      modules,
      liquids,
      labwareDefinitions,
      commands: protocolAnalysis.commands,
    }
  }
  return null
}
