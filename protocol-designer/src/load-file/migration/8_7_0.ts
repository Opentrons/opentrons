import { AUTOMATIC } from '@opentrons/step-generation'

import type { ProtocolFile } from '@opentrons/shared-data'
import type { PDMetadata } from '/protocol-designer/file-types'
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands'

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
      const { stepType, id } = form
      if (stepType === 'moveLiquid' || stepType === 'mix') {
        return {
          ...acc,
          [id]: {
            ...form,
            tip_tracking: AUTOMATIC,
            tiprack_selected: null,
            tips_selected: [],
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
