import type {
  LoadLabwareRunTimeCommand,
  LoadModuleRunTimeCommand,
} from '../../protocol/types/schemaV6/command/setup'
import type { RunTimeCommand, ProtocolFile } from '../../protocol'
import type { PipetteName } from '../pipettes'
import type {
  ProtocolResource,
  LabwareDefinition2,
  ModuleModel,
} from '../types'
// This adapter exists to resolve the interface mismatch between the PE analysis response
// and the protocol schema v6 interface. Much of this logic should be deleted once we resolve
// these discrepencies on the server side
const TRASH_ID = 'fixedTrash'
export const schemaV6Adapter = (
  protocolAnalyses: ProtocolResource['analyses'][0]
): ProtocolFile<{}> => {
  if (protocolAnalyses != null && protocolAnalyses.status === 'completed') {
    const pipettes: {
      [pipetteId: string]: { name: PipetteName }
    } = protocolAnalyses.pipettes.reduce((acc, pipette) => {
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
    } = protocolAnalyses.labware.reduce((acc, labware) => {
      const labwareId = labware.id
      if (labwareId === TRASH_ID) {
        return { ...acc }
      }
      const loadCommand: LoadLabwareRunTimeCommand | null =
        protocolAnalyses.commands.find(
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
    } = protocolAnalyses.commands
      .filter(
        (command: RunTimeCommand): command is LoadLabwareRunTimeCommand =>
          command.commandType === 'loadLabware'
      )
      .reduce((acc, command: LoadLabwareRunTimeCommand) => {
        const labwareDef: LabwareDefinition2 = command.result?.definition
        const labwareId = command.result?.labwareId ?? ''
        const definitionUri = protocolAnalyses.labware.find(
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
    } = protocolAnalyses.commands
      .filter(
        (command: RunTimeCommand): command is LoadModuleRunTimeCommand =>
          command.commandType === 'loadModule'
      )
      .reduce((acc, command: LoadModuleRunTimeCommand) => {
        const moduleId = command.result?.moduleId ?? ''
        // @ts-expect-error at the time this adapter is being used model is not a part of params yet, only moduleId
        const moduleModel = command.params?.model

        return {
          ...acc,
          [moduleId]: { model: moduleModel },
        }
      }, {})

    // @ts-expect-error this is a v6 like object that does not quite match the v6 spec at the moment
    return {
      pipettes,
      labware,
      modules,
      labwareDefinitions,
      commands: protocolAnalyses.commands,
    }
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {} as ProtocolFile<{}>
}
