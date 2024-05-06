import {
  getModuleType,
  getLabwareDefURI,
  RunTimeCommand,
  getPipetteNameSpecs,
  FIXED_TRASH_ID,
  LabwareDefinition2,
  getAllDefinitions,
} from '@opentrons/shared-data'
import { PickUpTipRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import { LoadLabwareRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import { InvariantContext } from '../types'

const FIXED_TRASH_LOADNAME = 'opentrons_1_trash_3200ml_fixed'

export function constructInvariantContextFromRunCommands(
  commands: RunTimeCommand[]
): InvariantContext {
  const fixedTrashDef = getLatestLabwareDef(FIXED_TRASH_LOADNAME)
  return commands.reduce(
    (acc, command) => {
      if (command.commandType === 'loadLabware') {
        return {
          ...acc,
          labwareEntities: {
            ...acc.labwareEntities,
            [command.result.labwareId]: {
              id: command.result.labwareId,
              labwareDefURI: getLabwareDefURI(command.result.definition),
              def: command.result.definition,
            },
          },
        }
      } else if (command.commandType === 'loadModule') {
        return {
          ...acc,
          moduleEntities: {
            ...acc.moduleEntities,
            [command.result.moduleId]: {
              id: command.result.moduleId,
              type: getModuleType(command.result.model),
              model: command.result.model,
            },
          },
        }
      } else if (command.commandType === 'loadPipette') {
        const labwareId =
          commands.find(
            (c): c is PickUpTipRunTimeCommand =>
              c.commandType === 'pickUpTip' &&
              c.params.pipetteId === command.result.pipetteId
          )?.params.labwareId ?? null
        const tiprackLabwareDef =
          labwareId != null
            ? commands.find(
                (c): c is LoadLabwareRunTimeCommand =>
                  c.commandType === 'loadLabware' &&
                  c.result.labwareId === labwareId
              )?.result.definition ?? null
            : null

        console.log('load pipette command', command)
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
      } else if (command.commandType === 'loadLiquid') {
        const { displayColor } = command.params
        return {
          ...acc,
          liquidEntities: {
            ...acc.liquidEntities,
            [command.result.liquidId]: {
              description: 'stub liquid description',
              displayName: command.result.liquidId,
              displayColor,
            },
          },
        }
      }

      return acc
    },
    {
      labwareEntities: {
        [FIXED_TRASH_ID]: {
          id: FIXED_TRASH_ID,
          labwareDefURI: getLabwareDefURI(fixedTrashDef) ?? '',
          def: fixedTrashDef,
        },
      },
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

