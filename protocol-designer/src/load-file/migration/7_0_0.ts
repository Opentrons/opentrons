import type { ProtocolFileV6 } from '@opentrons/shared-data'
import type {
  LoadPipetteCreateCommand,
  LoadModuleCreateCommand,
  LoadLabwareCreateCommand,
  LabwareLocation,
  ProtocolFile,
} from '@opentrons/shared-data/protocol/types/schemaV7'
import type {
  LoadPipetteCreateCommand as LoadPipetteCommandV6,
  LoadModuleCreateCommand as LoadModuleCommandV6,
  LoadLabwareCreateCommand as LoadLabwareCommandV6,
} from '@opentrons/shared-data/protocol/types/schemaV6'
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands'

// NOTE: this migration removes pipettes, labware, and modules as top level keys and adds necessary
// params to the load commands.
const PD_VERSION = '7.0.0'
const SCHEMA_VERSION = 7

export const migrateFile = (
  appData: ProtocolFileV6<DesignerApplicationData>
): ProtocolFile => {
  const { commands, labwareDefinitions } = appData
  const { pipettes, labware, modules, ...rest } = appData

  const loadPipetteCommands: LoadPipetteCreateCommand[] = commands
    .filter(
      (command): command is LoadPipetteCommandV6 =>
        command.commandType === 'loadPipette'
    )
    .map(command => ({
      ...command,
      params: {
        ...command.params,
        pipetteName: pipettes[command.params.pipetteId].name,
      },
    }))

  const loadModuleCommands: LoadModuleCreateCommand[] = commands
    .filter(
      (command): command is LoadModuleCommandV6 =>
        command.commandType === 'loadModule'
    )
    .map(command => ({
      ...command,
      params: {
        ...command.params,
        model: modules[command.params.moduleId].model,
      },
    }))

  const loadLabwareCommands: LoadLabwareCreateCommand[] = commands
    .filter(
      (command): command is LoadLabwareCommandV6 =>
        command.commandType === 'loadLabware'
    )
    .map(command => {
      const labwareId = command.params.labwareId
      const definitionId = labware[labwareId].definitionId
      const { namespace, version } = labwareDefinitions[definitionId]
      const labwareLocation = command.params.location
      let location: LabwareLocation = 'offDeck'
      if (labwareLocation === 'offDeck') {
        location = 'offDeck'
      } else if ('moduleId' in labwareLocation) {
        location = { moduleId: labwareLocation.moduleId }
      } else if ('slotName' in labwareLocation) {
        location = { slotName: labwareLocation.slotName }
      }
      return {
        ...command,
        params: {
          ...command.params,
          loadName: definitionId,
          namespace,
          version,
          location,
          displayName: labware[labwareId].displayName,
        },
      }
    })

  return {
    ...rest,
    designerApplication: {
      ...appData.designerApplication,
      version: PD_VERSION,
    },
    schemaVersion: SCHEMA_VERSION,
    $otSharedSchema: '#/protocol/schemas/7',
    commands: [
      ...loadPipetteCommands,
      ...loadModuleCommands,
      ...loadLabwareCommands,
    ],
  }
}
