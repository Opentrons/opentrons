import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
// NOTE: this migration bump adds load commands (loadLiquid, loadModule, loadPipette, loadLabware), modifies both pipette
//  and labware access parameters, renames AirGap to aspirate, and removes all temporal properties from labware, pipettes,
//  and module keys such as slot, mount

export const PD_VERSION = '6.0.0'
export const SCHEMA_VERSION = '6.0.0'

const migrateRobot = (appData: Record<string, any>): Record<string, any> => {
  // update robot to return model and deck
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

// export const migrateCommands = (
//   appData: Record<string, any>
// ): Record<string, any> => {
//   // Pause form key name and value enum changed
//   return mapValues(appData, commands => {
//     if (commands.commandType === 'home') {
//       return {
//         id: commands.id,
//         params: commands.params.axes,
//       }
//     } else if (commands.commandType === 'loadPipette') {
//       return {
//         id: commands.id,
//         params: {
//           pipetteId: commands.params.pipetteId,
//           mount: commands.params.mount,
//         },
//       }
//     } else if (commands.commandType === 'loadModule') {
//       return {
//         id: commands.id,
//         params: {
//           moduleId: commands.params.moduleId,
//           location: { slotName: commands.params.location.slotName },
//         },
//       }
//     } else if (commands.commandType === 'loadLabware') {
//       return {
//         id: commands.id,
//         params: {
//           labwareId: commands.params.labwareId,
//           location: { slotName: commands.params.location.slotName },
//         },
//       }
//     } else if (commands.commandType === 'loadLiquid') {
//       return {
//         id: commands.id,
//         params: {
//           labwareId: commands.params.labwareId,
//           location: { slotName: commands.params.location.slotName },
//         },
//       }
//     }
//     return commands
//   })
// }

const migrateCommands = (appData: Record<string, any>): Record<string, any> => {
    return mapValues(appData, commands => {
        return {
          ...commands,
          id: commands.id,
        }
      })
  }

export const migrateFile = (fileData: any): any => {
  return {
    designerApplication: {
      name: 'opentrons/protocol-designer',
      version: PD_VERSION,
      ...fileData.designerApplication.data,
    },
    schemaVersion: SCHEMA_VERSION,
    $otSharedSchema: '#/protocol/schemas/6',
    metadata: fileData.metadata,
    robot: migrateRobot(fileData.robot),
    pipettes: migratePipettes(fileData.pipettes),
    labware: migrateLabware(fileData.labware),
    labwareDefinitions: fileData.labwareDefinitions,
    modules: migrateModules(fileData.modules),
    commands: migrateCommands(fileData.commands),
  }
}
