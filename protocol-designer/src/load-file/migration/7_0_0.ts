import { uuid } from '../../utils'
import { getAdapterAndLabwareSplitInfo } from './utils/getAdapterAndLabwareSplitInfo'
import { ProtocolFileV6 } from '@opentrons/shared-data'
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
// params to the load commands. Also, this introduces loadAdapter commands
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

  //  need better way to filter this since the strip tubes in 96 well alum block are allowed!
  const getIsAdapter = (labwareId: string): boolean =>
    labwareId.includes('96_aluminumblock') || labwareId.includes('adapter')

  //  todo: update this type to LoadAdapterCreateCommand[]
  const loadAdapterAndLabwareCommands: any = commands
    .filter(
      (command): command is LoadLabwareCommandV6 =>
        command.commandType === 'loadLabware' &&
        getIsAdapter(command.params.labwareId)
    )
    .flatMap(command => {
      const {
        adapterLoadname,
        labwareLoadname,
        adapterDisplayName,
        labwareDisplayName,
      } = getAdapterAndLabwareSplitInfo(command.params.labwareId)
      const labwareLocation = command.params.location
      let adapterLocation: LabwareLocation = 'offDeck'
      if (labwareLocation === 'offDeck') {
        adapterLocation = 'offDeck'
      } else if ('moduleId' in labwareLocation) {
        adapterLocation = { moduleId: labwareLocation.moduleId }
      } else if ('slotName' in labwareLocation) {
        adapterLocation = { slotName: labwareLocation.slotName }
      }
      const adapterId = `${uuid()}:opentrons/${adapterLoadname}/1`

      const loadAdapterCommand = {
        key: uuid(),
        commandType: 'loadAdapter',
        params: {
          adapterId,
          loadName: adapterLoadname,
          namespace: 'opentrons',
          version: 1,
          location: adapterLocation,
          displayName: adapterDisplayName,
        },
      }

      const loadLabwareCommand: LoadLabwareCreateCommand = {
        key: uuid(),
        commandType: 'loadLabware',
        params: {
          labwareId: `${uuid()}:opentrons/${labwareLoadname}/1`,
          loadName: labwareLoadname,
          namespace: 'opentrons',
          version: 1,
          location: { adapterId: adapterId },
          displayName: labwareDisplayName,
        },
      }

      return [loadAdapterCommand, loadLabwareCommand]
    })

  const loadLabwareCommands: LoadLabwareCreateCommand[] = commands
    .filter(
      (command): command is LoadLabwareCommandV6 =>
        command.commandType === 'loadLabware' &&
        getIsAdapter(command.params.labwareId) === false
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
      ...loadAdapterAndLabwareCommands,
      ...loadLabwareCommands,
    ],
  }
}
