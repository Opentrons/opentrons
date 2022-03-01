import { map } from 'lodash'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import { uuid } from '../../utils'
// NOTE: this migration bump adds load commands (loadLiquid, loadModule, loadPipette, loadLabware), modifies both pipette
//  and labware access parameters, renames AirGap to aspirate, and removes all temporal properties from labware, pipettes,
//  and module keys such as slot, mount

export const PD_VERSION = '6.0.0'
export const SCHEMA_VERSION = 6

const migrateRobot = (appData: any): any => {
  return mapValues(appData, robot => {
    return {
      ...robot,
      deckId: 'ot2_standard',
    }
  })
}

const migratePipettes = (appData: Record<string, any>): Record<string, any> => {
  return mapValues(appData, pipettes => {
    const removeMount = omit(pipettes, 'mount')
    return removeMount
  })
}

const migrateLabware = (appData: Record<string, any>): Record<string, any> => {
  return mapValues(appData, labware => {
    const removeSlot = omit(labware, 'slot')
    return removeSlot
  })
}

const migrateModules = (appData: Record<string, any>): Record<string, any> => {
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
        loaction: { slotName: module.slot },
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
        labwawreId: labwareId,
        location: { slotName: labware.slot },
      },
    }
    return loadLabwareCommand
  })

  const commands = appData.commands
  const migrateV5Commands = map(commands, command => {
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
    robot: migrateRobot(appData.robot),
    pipettes: migratePipettes(appData.pipettes),
    labware: migrateLabware(appData.labware),
    labwareDefinitions: appData.labwareDefinitions,
    modules: migrateModules(appData.modules),
    commands: [
      ...loadModuleCommands,
      ...loadPipetteCommands,
      ...loadLabwareCommands,
      ...migrateV5Commands,
    ],
  }
}
