import {
  getLabwareDefURI,
  getModuleType,
  getPipetteSpecsV2,
} from '@opentrons/shared-data'

import { uuid } from '.'
import { GRIPPER_LOCATION } from '../constants'

import type {
  LoadLabwareRunTimeCommand,
  PickUpTipRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  LabwareEntities,
  ModuleEntities,
  PipetteEntities,
  TrashBinEntities,
  WasteChuteEntities,
} from '../types'

export function constructInvariantContextFromRunCommands(
  commands: RunTimeCommand[]
): InvariantContext {
  return commands.reduce(
    (acc: InvariantContext, command: RunTimeCommand) => {
      if (command.commandType === 'loadLabware' && command.result != null) {
        const result = command.result

        if (result.definition.schemaVersion === 2) {
          const labwareEntities: LabwareEntities = {
            ...acc.labwareEntities,
            [result.labwareId]: {
              id: result.labwareId,
              labwareDefURI: getLabwareDefURI(result.definition),
              def: result.definition,
              //  ProtocolTimelineScrubber won't need access to pythonNames
              pythonName: 'n/a',
              labwareNickName:
                command.params.displayName ??
                result.definition.metadata.displayName,
            },
          }
          return {
            ...acc,
            labwareEntities,
          }
        } else {
          // todo(mm, 2025-05-16):
          // loadLabware commands from the backend can have schema 3 labware definitions.
          // step-generation, and this function by extension, are not prepared to handle
          // schema 3 yet. Just ignore those definitions for now.
          // See also the loadPipette handling, below.
          return acc
        }
      } else if (
        command.commandType === 'loadModule' &&
        command.result != null
      ) {
        const result = command.result
        const moduleEntities: ModuleEntities = {
          ...acc.moduleEntities,
          [result.moduleId]: {
            id: result.moduleId,
            type: getModuleType(command.params.model),
            model: command.params.model,
            pythonName: 'n/a',
          },
        }
        return {
          ...acc,
          moduleEntities,
        }
      } else if (
        command.commandType === 'loadPipette' &&
        command.result != null
      ) {
        const result = command.result
        const labwareId =
          commands.find(
            (c): c is PickUpTipRunTimeCommand =>
              c.commandType === 'pickUpTip' &&
              c.params.pipetteId === result.pipetteId
          )?.params.labwareId ?? null
        const matchingCommand =
          commands.find(
            (c): c is LoadLabwareRunTimeCommand =>
              c.commandType === 'loadLabware' &&
              c.result != null &&
              c.result.labwareId === labwareId
          ) ?? null

        let tiprackLabwareDef = matchingCommand?.result?.definition ?? null
        // We're not prepared to handle labware schema 3 yet. See the todo comment
        // in the loadLabware handling, above.
        if (tiprackLabwareDef?.schemaVersion === 3) {
          tiprackLabwareDef = null
        }

        const specs: any = getPipetteSpecsV2(command.params.pipetteName)

        const pipetteEntities: PipetteEntities = {
          ...acc.pipetteEntities,
          [result.pipetteId]: {
            name: command.params.pipetteName,
            id: command.params.pipetteId,
            tiprackLabwareDef:
              tiprackLabwareDef != null ? [tiprackLabwareDef] : [],
            tiprackDefURI:
              tiprackLabwareDef != null
                ? [getLabwareDefURI(tiprackLabwareDef)]
                : [],
            spec: specs,
            pythonName: 'n/a',
          },
        }
        return {
          ...acc,
          pipetteEntities,
        }
      } else if (
        command.commandType === 'moveToAddressableArea' ||
        command.commandType === 'moveToAddressableAreaForDropTip'
      ) {
        const addressableAreaName = command.params.addressableAreaName
        const id = `${uuid()}:${addressableAreaName}`
        let location: string = GRIPPER_LOCATION
        if (addressableAreaName === 'fixedTrash') {
          location = 'cutout12'
        } else if (addressableAreaName.includes('WasteChute')) {
          location = 'cutoutD3'
        } else if (addressableAreaName.includes('movableTrash')) {
          location = `cutout${addressableAreaName.split('movableTrash')[1]}`
        }
        let trashBinEntities: TrashBinEntities = acc.trashBinEntities
        if (
          !Object.values(acc.trashBinEntities).some(
            entity => entity.location === location
          )
        ) {
          trashBinEntities = {
            ...acc.trashBinEntities,
            [id]: {
              pythonName: 'trash_bin_1',
              id,
              location,
            },
          }
        }

        const wasteChuteEntities: WasteChuteEntities = {
          ...acc.wasteChuteEntities,
          [id]: {
            pythonName: 'waste_chute',
            id,
            location,
          },
        }
        return {
          ...acc,
          trashBinEntities,
          wasteChuteEntities,
        }
      }

      return acc
    },
    {
      labwareEntities: {},
      moduleEntities: {},
      pipetteEntities: {},
      wasteChuteEntities: {},
      trashBinEntities: {},
      //  this util is used for the timeline scrubber. It grabs staging area info from
      //  command analysis. Also, it does not visualize the gripper right now
      stagingAreaEntities: {},
      gripperEntities: {},
      //  this util is used for the timeline scrubber. It grabs liquid info from analysis
      //  so this will not be wired up right now
      liquidEntities: {},
      config: { OT_PD_DISABLE_MODULE_RESTRICTIONS: true },
    }
  )
}
