import {
  getModuleType,
  getLabwareDefURI,
  getPipetteSpecsV2,
} from '@opentrons/shared-data'
import type {
  LoadLabwareRunTimeCommand,
  RunTimeCommand,
  PickUpTipRunTimeCommand,
} from '@opentrons/shared-data'
import type { InvariantContext } from '../types'

export function constructInvariantContextFromRunCommands(
  commands: RunTimeCommand[]
): InvariantContext {
  return commands.reduce(
    (acc: InvariantContext, command: RunTimeCommand) => {
      if (command.commandType === 'loadLabware' && command.result != null) {
        const result = command.result
        return {
          ...acc,
          labwareEntities: {
            ...acc.labwareEntities,
            [result.labwareId]: {
              id: result.labwareId,
              labwareDefURI: getLabwareDefURI(result.definition),
              def: result.definition,
            },
          },
        }
      } else if (
        command.commandType === 'loadModule' &&
        command.result != null
      ) {
        const result = command.result
        return {
          ...acc,
          moduleEntities: {
            ...acc.moduleEntities,
            [result.moduleId]: {
              id: result.moduleId,
              type: getModuleType(command.params.model),
              model: command.params.model,
            },
          },
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

        const tiprackLabwareDef =
          matchingCommand != null && matchingCommand.result != null
            ? matchingCommand.result.definition ?? null
            : null

        return {
          ...acc,
          pipetteEntities: {
            ...acc.pipetteEntities,
            [result.pipetteId]: {
              tiprackLabwareDef,
              spec: getPipetteSpecsV2(command.params.pipetteName),
            },
          },
        }
      }

      return acc
    },
    {
      labwareEntities: {},
      moduleEntities: {},
      pipetteEntities: {},
      additionalEquipmentEntities: {},
      config: { OT_PD_DISABLE_MODULE_RESTRICTIONS: true },
    }
  )
}
