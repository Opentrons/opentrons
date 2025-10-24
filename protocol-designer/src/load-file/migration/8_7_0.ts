import { AUTOMATIC } from '@opentrons/step-generation'

import { getDefaultNozzleConfiguration } from './utils/__tests__/getDefaultNozzleConfiguration'

import type {
  NozzleConfigurationStyle,
  ProtocolFile,
} from '@opentrons/shared-data'
import type { PDMetadata } from '/protocol-designer/file-types'

export const migrateFile = (
  appData: ProtocolFile<PDMetadata>
): ProtocolFile<PDMetadata> => {
  const { designerApplication } = appData

  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }
  const { savedStepForms, pipettes } = designerApplication.data

  const savedStepsWithUpdatedFields = Object.values(savedStepForms).reduce(
    (acc, form) => {
      const { stepType, id } = form
      if (stepType === 'moveLiquid' || stepType === 'mix') {
        const { pipette, nozzles } = form
        const convertedNozzleConfiguration = getDefaultNozzleConfiguration(
          nozzles as NozzleConfigurationStyle,
          pipettes,
          pipette as string
        )
        return {
          ...acc,
          [id]: {
            ...form,
            tip_tracking: AUTOMATIC,
            tiprack_selected: null,
            tips_selected: [],
            nozzles: convertedNozzleConfiguration,
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
