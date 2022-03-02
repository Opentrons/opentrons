import { map } from 'lodash'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import { uuid } from '../../utils'
// NOTE: this migration bump adds load commands (loadLiquid, loadModule, loadPipette, loadLabware), modifies both pipette
//  and labware access parameters, renames AirGap to aspirate, and removes all temporal properties from labware, pipettes,
//  and module keys such as slot, mount
//  and renames well to wellName

export const PD_VERSION = '6.0.0'
export const SCHEMA_VERSION = 6

export const migratePipettes = (
  appData: Record<string, any>
): Record<string, any> => {
  return mapValues(appData, pipettes => {
    const removeMount = omit(pipettes, 'mount')
    return removeMount
  })
}

export const migrateLabware = (
  appData: Record<string, any>
): Record<string, any> => {
  return mapValues(appData, labware => {
    const removeSlot = omit(labware, 'slot')
    return removeSlot
  })
}

export const migrateModules = (
  appData: Record<string, any>
): Record<string, any> => {
  return mapValues(appData, modules => {
    const removeSlot = omit(modules, 'slot')
    return removeSlot
  })
}

export const migrateFile = (appData: any): any => {
  const pipettes = appData.pipettes
  const loadPipetteCommands = map(pipettes, (pipette, pipetteId) => {
    const loadPipetteCommand = {
      id: uuid(),
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
      id: uuid(),
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
      id: uuid(),
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
    command.params.wellName = command.params.well
    delete command.params.well
    const migrateV5Commands = {
      commandType: command.command === 'airGap' ? 'aspirate' : command.command,
      id: uuid(),
      params: command.params,
    }
    return migrateV5Commands
  })
  return {
    designerApplication: {
      name: 'opentrons/protocol-designer',
      version: PD_VERSION,
      data: appData.designerApplication.data ?? undefined,
    },
    schemaVersion: SCHEMA_VERSION,
    $otSharedSchema: '#/protocol/schemas/6',
    metadata: appData.metadata,
    robot: {
      model: 'OT-2 Standard',
      deckId: 'ot2_standard',
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
