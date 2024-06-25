import {
  getModuleType,
  getLabwareDefURI,
  RunTimeCommand,
  getPipetteNameSpecs,
  LabwareDefinition2,
  getAllDefinitions,
} from '@opentrons/shared-data'
import { PickUpTipRunTimeCommand } from '@opentrons/shared-data'
import { LoadLabwareRunTimeCommand } from '@opentrons/shared-data'
import {
  InvariantContext,
  LabwareEntities,
  LiquidEntities,
  ModuleEntities,
  PipetteEntities,
} from '../types'

export function constructInvariantContextFromRunCommands(
  commands: RunTimeCommand[]
): InvariantContext {
  return commands.reduce(
    (acc: InvariantContext, command: RunTimeCommand) => {
      const result = command.result
      if (command.commandType === 'loadLabware' && result != null) {
        return {
          ...acc,
          labwareEntities: {
            ...acc.labwareEntities,
            [result.labwareId]: {
              id: result.labwareId,
              labwareDefURI: getLabwareDefURI(result.definition),
              def: result.definition,
            },
          } as LabwareEntities,
        }
      } else if (command.commandType === 'loadModule' && result != null) {
        return {
          ...acc,
          moduleEntities: {
            ...acc.moduleEntities,
            [result.moduleId]: {
              id: result.moduleId,
              type: getModuleType(command.params.model),
              model: command.params.model,
            },
          } as ModuleEntities,
        }
      } else if (command.commandType === 'loadPipette' && result != null) {
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
              spec: getPipetteNameSpecs(command.params.pipetteName),
            },
          } as PipetteEntities,
        }
      } else if (command.commandType === 'loadLiquid' && result != null) {
        const { displayColor } = command.params
        return {
          ...acc,
          liquidEntities: {
            ...acc.liquidEntities,
            [command.params.labwareId]: {
              description: 'stub liquid description',
              displayName: command.params.labwareId,
              displayColor: '#ffd600'
            },
          } as LiquidEntities,
        }
      }

      return acc
    },
    {
      labwareEntities: {},
      moduleEntities: {},
      pipetteEntities: {},
      liquidEntities: {},
      additionalEquipmentEntities: {},
      config: { OT_PD_DISABLE_MODULE_RESTRICTIONS: true },
    }
  )
}

// taken from app/src/assets/labware/getLabware
export function getLatestLabwareDef(
  loadName: string | null | undefined
): LabwareDefinition2 | null {
  const def = Object.values(getAllDefinitions()).find(
    d => d.parameters.loadName === loadName
  )
  return def || null
}
