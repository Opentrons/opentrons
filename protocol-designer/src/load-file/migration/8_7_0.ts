import { ALL, getPipetteSpecsV2, SINGLE } from '@opentrons/shared-data'
import { AUTOMATIC } from '@opentrons/step-generation'

import type {
  NozzleConfigurationStyle,
  ProtocolFile,
} from '@opentrons/shared-data'
import type { PDMetadata, Pipettes } from '/protocol-designer/file-types'

const getDefaultNozzleConfiguration = (
  rawNozzles: NozzleConfigurationStyle | null,
  pipettes: Pipettes,
  pipetteId: string
): NozzleConfigurationStyle => {
  if (rawNozzles != null) {
    return rawNozzles
  }
  const pipetteName = pipettes?.[pipetteId]?.pipetteName ?? null
  const pipetteSpecs =
    pipetteName != null ? getPipetteSpecsV2(pipetteName) : null
  const pipetteChannels = pipetteSpecs?.channels

  switch (pipetteChannels) {
    case 1:
      return SINGLE
    case 8:
    case 96:
      return ALL

    // should not hit
    default:
      console.warn('Unknown pipette channels:', pipetteChannels)
      return ALL
  }
}

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
