import {
  ETHANOL_LIQUID_CLASS_NAME,
  GLYCEROL_LIQUID_CLASS_NAME,
  WATER_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'

import { DEFAULT_MM_OFFSET_FROM_BOTTOM } from '/protocol-designer/constants'

import type { ProtocolFile } from '@opentrons/shared-data'
import type { PDMetadata } from '/protocol-designer/file-types'
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands'

// deprecated liquid class names!
const WATER_LIQUID_CLASS_NAME_V1 = 'waterV1'
const GLYCEROL_LIQUID_CLASS_NAME_V1 = 'glycerol50V1'
const ETHANOL_LIQUID_CLASS_NAME_V1 = 'ethanol80V1'

const getNormalizedTime = (time: string): string => {
  const timeParts = time.split(':').map(Number)
  const missing = 3 - timeParts.length
  const normalized = [...Array(missing).fill(0), ...timeParts]
  return normalized.join(':')
}

const getMigratedLiquidClassNames = (liquidClass: string): string => {
  if (liquidClass === WATER_LIQUID_CLASS_NAME_V1) {
    return WATER_LIQUID_CLASS_NAME
  } else if (liquidClass === GLYCEROL_LIQUID_CLASS_NAME_V1) {
    return GLYCEROL_LIQUID_CLASS_NAME
  } else if (liquidClass === ETHANOL_LIQUID_CLASS_NAME_V1) {
    return ETHANOL_LIQUID_CLASS_NAME
  } else return liquidClass
}

export const migrateFile = (
  appData: ProtocolFile<PDMetadata>
): ProtocolFile<PDMetadata> => {
  const { designerApplication } = appData

  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }
  const savedStepForms = designerApplication.data
    ?.savedStepForms as DesignerApplicationData['savedStepForms']

  const savedStepsWithUpdatedFields = Object.values(savedStepForms).reduce(
    (acc, form) => {
      //  introduction of allowing hours to heater-shaker timer field
      if (form.stepType === 'heaterShaker') {
        const { id, heaterShakerTimer } = form

        return {
          ...acc,
          [id]: {
            ...form,
            heaterShakerTimer:
              heaterShakerTimer != null
                ? getNormalizedTime(heaterShakerTimer as string)
                : null,
          },
        }
      }
      //  fixes a bug where the aspirate/dispense z-offset in the commands was
      //  defaulting to 1mm but the form fields were null
      if (form.stepType === 'moveLiquid') {
        const {
          id,
          aspirate_mmFromBottom,
          dispense_mmFromBottom,
          liquidClass,
        } = form

        return {
          ...acc,
          [id]: {
            ...form,
            //  migrate from old liquidClass name
            liquidClass: getMigratedLiquidClassNames(liquidClass as string),
            aspirate_mmFromBottom:
              aspirate_mmFromBottom != null
                ? aspirate_mmFromBottom
                : DEFAULT_MM_OFFSET_FROM_BOTTOM,
            dispense_mmFromBottom:
              dispense_mmFromBottom != null
                ? dispense_mmFromBottom
                : DEFAULT_MM_OFFSET_FROM_BOTTOM,
          },
        }
      }

      if (form.stepType === 'mix') {
        const { id, liquidClass } = form
        return {
          ...acc,
          [id]: {
            ...form,
            //  migrate from old liquidClass name
            liquidClass: getMigratedLiquidClassNames(liquidClass as string),
          },
        }
      }
      return acc
    },
    {}
  )

  return {
    ...appData,
    designerApplication: {
      ...designerApplication,
      data: {
        ...designerApplication.data,
        savedStepForms: {
          ...designerApplication.data.savedStepForms,
          ...savedStepsWithUpdatedFields,
        },
      },
    },
  }
}
