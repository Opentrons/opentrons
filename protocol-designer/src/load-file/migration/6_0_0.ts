import { map } from 'lodash'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import { OT2_STANDARD_DECKID, OT2_STANDARD_MODEL } from '@opentrons/shared-data'
import { ProtocolFile } from '@opentrons/shared-data/protocol/types/schemaV6'
import { uuid } from '../../utils'
// NOTE: this migration bump adds load commands (loadLiquid, loadModule, loadPipette, loadLabware), modifies both pipette
//  and labware access parameters, renames AirGap to aspirate, and removes all temporal properties from labware, pipettes,
//  and module keys such as slot, mount
//  and renames well to wellName

const PD_VERSION = '6.0.0'
const SCHEMA_VERSION = 6

const migratePipettes = (appData: Record<string, any>): Record<string, any> =>
  mapValues(appData, pipettes => omit(pipettes, 'mount'))

const migrateLabware = (appData: Record<string, any>): Record<string, any> =>
  mapValues(appData, labware => omit(labware, 'slot'))

const migrateModules = (appData: Record<string, any>): Record<string, any> =>
  mapValues(appData, modules => omit(modules, 'slot'))

export const migrateFile = (appData: any): ProtocolFile<{}> => {
  const pipettes = appData.pipettes
  const loadPipetteCommands = map(pipettes, (pipette, pipetteId) => {
    const loadPipetteCommand = {
      key: uuid(),
      commandType: 'loadPipette',
      params: {
        pipetteId: pipetteId,
        mount: pipette.mount,
      },
    }
    return loadPipetteCommand
  })

  const modules = appData.modules
  const loadModuleCommands = map(modules, (module, moduleId) => {
    const loadModuleCommand = {
      key: uuid(),
      commandType: 'loadModule',
      params: {
        moduleId: moduleId,
        location: { slotName: module.slot },
      },
    }
    return loadModuleCommand
  })

  const labware = appData.labware
  const loadLabwareCommands = map(labware, (labware, labwareId) => {
    const loadLabwareCommand = {
      key: uuid(),
      commandType: 'loadLabware',
      params: {
        labwareId: labwareId,
        location: { slotName: labware.slot },
      },
    }
    return loadLabwareCommand
  })

  const commands = appData.commands
  const migrateV5Commands = map(commands, command => {
    command.params.well = command.params.wellName
    delete command.params.well

    const migrateV5Commands = {
      commandType: command.command === 'airGap' ? 'aspirate' : command.command,
      key: uuid(),
      params: command.params,
    }
    return migrateV5Commands
  })
  return {
    designerApplication: {
      name: 'opentrons/protocol-designer',
      version: PD_VERSION,
      data:
        appData.designerApplication === undefined
          ? undefined
          : appData.designerApplication.data,
    },
    schemaVersion: SCHEMA_VERSION,
    $otSharedSchema: '#/protocol/schemas/6',
    metadata: appData.metadata,
    robot: {
      model: OT2_STANDARD_MODEL,
      deckId: OT2_STANDARD_DECKID,
    },
    pipettes: migratePipettes(appData.pipettes),
    labware: migrateLabware(appData.labware),
    labwareDefinitions: appData.labwareDefinitions,
    modules: migrateModules(appData.modules),
    commands: [
      ...loadPipetteCommands,
      ...loadModuleCommands,
      ...loadLabwareCommands,
      ...migrateV5Commands,
    ],
  }
}
