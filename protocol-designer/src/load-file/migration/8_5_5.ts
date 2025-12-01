import type { ProtocolFile } from '@opentrons/shared-data'
import type { PDMetadata } from '../../file-types'

export const migrateFile = (
  appData: ProtocolFile<PDMetadata>
): ProtocolFile<PDMetadata> => {
  const { designerApplication } = appData

  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }
  const { savedStepForms, pipetteTiprackAssignments, labware } =
    designerApplication.data

  const savedStepsWithUpdatedPipettingFields = Object.entries(
    savedStepForms
  ).reduce((acc: typeof savedStepForms, [stepId, form]) => {
    if (form.stepType === 'moveLiquid' || form.stepType === 'mix') {
      const { tipRack, pipette } = form
      const assignedTipracks = pipetteTiprackAssignments[pipette] ?? []

      // if the tiprack assigned in the form step isn't in the pipette's assigned tipracks
      // then update it
      if (!assignedTipracks.includes(tipRack as string)) {
        //  check that the new assigned tiprack is even a labware entity,
        //  otherwise default to null
        const newLoadLabwareInfo = Object.values(labware).find(lw =>
          assignedTipracks.includes(lw.labwareDefURI)
        )
        acc[stepId] = {
          ...form,
          tipRack: newLoadLabwareInfo?.labwareDefURI ?? null,
        }
        return acc
      }
    }
    acc[stepId] = form
    return acc
  }, {})

  return {
    ...appData,
    designerApplication: {
      ...designerApplication,
      data: {
        ...designerApplication.data,
        savedStepForms: {
          ...designerApplication.data.savedStepForms,
          ...savedStepsWithUpdatedPipettingFields,
        },
      },
    },
  }
}
