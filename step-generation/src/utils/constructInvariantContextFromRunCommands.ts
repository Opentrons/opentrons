import {
  getModuleType,
  getLabwareDefURI,
  RunTimeCommand,
  getPipetteNameSpecs,
  FIXED_TRASH_ID,
  LabwareDefinition2,
  getAllDefinitions,
} from '@opentrons/shared-data'
import { PickUpTipRunTimeCommand } from '@opentrons/shared-data'
import { LoadLabwareRunTimeCommand } from '@opentrons/shared-data'
import { InvariantContext } from '../types'

const FIXED_TRASH_LOADNAME = 'opentrons_1_trash_3200ml_fixed'

export function constructInvariantContextFromRunCommands(
  commands: RunTimeCommand[]
): InvariantContext {
  const fixedTrashDef = getLatestLabwareDef(FIXED_TRASH_LOADNAME)
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
          },
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
          },
        }
      } else if (command.commandType === 'loadPipette' && result != null) {
        const labwareId =
          commands.find(
            (c): c is PickUpTipRunTimeCommand =>
              c.commandType === 'pickUpTip' &&
              c.params.pipetteId === result.pipetteId
          )?.params.labwareId ?? null
        const tiprackLabwareDef =
          labwareId != null
            ? commands.find(
                (c): c is LoadLabwareRunTimeCommand =>
                  c.commandType === 'loadLabware' &&
                  c.result.labwareId === labwareId
              )?.result.definition ?? null
            : null

        return {
          ...acc,
          pipetteEntities: {
            ...acc.pipetteEntities,
            [command.result.pipetteId]: {
              tiprackLabwareDef,
              spec: getPipetteNameSpecs(command.params.pipetteName),
            },
          },
        }
      } else if (command.commandType === 'loadLiquid' && result != null) {
        const { displayColor } = command.params
        return {
          ...acc,
          liquidEntities: {
            ...acc.liquidEntities,
            [result.liquidId]: {
              description: 'stub liquid description',
              displayName: result.liquidId,
              displayColor,
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
