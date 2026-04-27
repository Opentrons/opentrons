import {
  ALL,
  getPipetteNameSpecs,
  POSITION_REFERENCE_TOP,
  SINGLE,
} from '@opentrons/shared-data'
import { getDefaultPrimaryNozzle } from '@opentrons/step-generation'

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
        const { pipette, nozzles, blowout_checkbox, blowout_location } = form
        const blowoutInLabware =
          blowout_location === 'source' || blowout_location === 'destination'
        const pipetteSpecs = getPipetteNameSpecs(pipettes[pipette].pipetteName)
        let confirmedNozzles: NozzleConfigurationStyle
        if (nozzles === SINGLE && pipetteSpecs?.channels === 1) {
          confirmedNozzles = ALL
        } else {
          confirmedNozzles = nozzles ?? ALL
        }
        let blowoutForm = {}
        if (stepType === 'moveLiquid' && blowout_checkbox && blowoutInLabware) {
          blowoutForm = {
            blowout_mmFromBottom: 1,
            blowout_x_position: 0,
            blowout_y_position: 0,
            blowout_position_reference: POSITION_REFERENCE_TOP,
          }
        }
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
              ...blowoutForm,
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
