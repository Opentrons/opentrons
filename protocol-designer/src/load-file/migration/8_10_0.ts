import { ALL, getPipetteNameSpecs } from '@opentrons/shared-data'
import { getDefaultPrimaryNozzle } from '@opentrons/step-generation'

import type { ProtocolFile } from '@opentrons/shared-data'
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
        const confirmedNozzles = nozzles ?? ALL
        const pipetteSpecs = getPipetteNameSpecs(pipettes[pipette].pipetteName)
        if (pipetteSpecs) {
          const primaryNozzle = getDefaultPrimaryNozzle({
            nozzles: confirmedNozzles,
            channels: pipetteSpecs.channels,
          })
          return {
            ...acc,
            [id]: {
              ...form,
              primaryNozzle: primaryNozzle,
              nozzles: confirmedNozzles,
            },
          }
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
