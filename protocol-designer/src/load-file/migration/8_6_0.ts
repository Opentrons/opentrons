import { DEFAULT_MM_OFFSET_FROM_BOTTOM } from '/protocol-designer/constants'

import type { ProtocolFile } from '@opentrons/shared-data'
import type { PDMetadata } from '/protocol-designer/file-types'
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands'

const getNormalizedTime = (time: string): string => {
  const timeParts = time.split(':').map(Number)
  const missing = 3 - timeParts.length
  const normalized = [...Array(missing).fill(0), ...timeParts]
  return normalized.join(':')
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
      const { id } = form
      if (form.stepType === 'heaterShaker') {
        const { heaterShakerTimer } = form

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
        const { aspirate_mmFromBottom, dispense_mmFromBottom } = form

        return {
          ...acc,
          [id]: {
            ...form,
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
