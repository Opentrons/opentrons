import {
  ALL,
  getPipetteNameSpecs,
  POSITION_REFERENCE_TOP,
} from '@opentrons/shared-data'
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
  const { savedStepForms, pipettes, labware } = designerApplication.data
  const initialDeckSetupStep = Object.values(savedStepForms).find(
    step => step.id === '__INITIAL_DECK_SETUP_STEP__'
  )

  const labwareLocationUpdate = (initialDeckSetupStep?.labwareLocationUpdate ??
    {}) as Record<string, string>

  const offDeckLabwareIds = Object.entries(labwareLocationUpdate)
    .filter(([_, location]) => location === 'offDeck')
    .map(([labwareId]) => labwareId)

  const offDeckLids = offDeckLabwareIds.filter(labwareId => {
    const lw = labware[labwareId]
    return lw?.displayName?.toLowerCase().includes('lid') ?? false
  })

  const offDeckLidSet = new Set(offDeckLids)
  const cleanedLabware = Object.fromEntries(
    Object.entries(labware).filter(
      ([labwareId]) => !offDeckLidSet.has(labwareId)
    )
  )
  const savedStepsWithUpdatedFields = Object.values(savedStepForms).reduce(
    (acc, form) => {
      const { stepType, id } = form
      if (id === '__INITIAL_DECK_SETUP_STEP__') {
        const cleanedLabwareLocationUpdate = Object.fromEntries(
          Object.entries(labwareLocationUpdate).filter(
            ([labwareId]) => !offDeckLidSet.has(labwareId)
          )
        )
        return {
          ...acc,
          [id]: {
            ...form,
            labwareLocationUpdate: cleanedLabwareLocationUpdate,
          },
        }
      }
      if (stepType === 'moveLabware' || stepType === 'manualIntervention') {
        const { labware } = form
        if (offDeckLids.includes(labware as string)) {
          return {
            ...acc,
            [id]: {
              ...form,
              labwareId: null,
              newLocation: null,
            },
          }
        }
      }
      if (stepType === 'moveLiquid' || stepType === 'mix') {
        const { pipette, nozzles, blowout_checkbox, blowout_location } = form
        const blowoutInLabware =
          blowout_location === 'source' || blowout_location === 'destination'
        const confirmedNozzles = nozzles ?? ALL
        const pipetteSpecs = getPipetteNameSpecs(pipettes[pipette].pipetteName)
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
        labware: cleanedLabware,
      },
    },
  }
}
