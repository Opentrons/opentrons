import { FLEX_ROBOT_TYPE, getPipetteSpecsV2 } from '@opentrons/shared-data'

import { CHANNELS_MAPPED_TO_MAX_SPEED } from '../../constants'

import type { ProtocolFile } from '@opentrons/shared-data'
import type { PDMetadata } from '../../file-types'

export const migrateFile = (
  appData: ProtocolFile<PDMetadata>
): ProtocolFile<PDMetadata> => {
  const { designerApplication, robot } = appData

  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }

  const { savedStepForms, pipetteTiprackAssignments, labware, pipettes } =
    designerApplication.data

  const robotType = robot.model
  const savedStepsWithUpdatedPipettingFields = Object.entries(
    savedStepForms
  ).reduce((acc: typeof savedStepForms, [stepId, form]) => {
    if (form.stepType === 'moveLiquid' || form.stepType === 'mix') {
      const { tipRack, pipette } = form

      // get max submerge and retract speed
      const pipetteName = pipettes?.[pipette]?.pipetteName ?? null
      const pipetteSpecs =
        pipetteName != null ? getPipetteSpecsV2(pipetteName) : null
      const channelsForSpeed =
        pipetteSpecs?.channels ?? (robotType === FLEX_ROBOT_TYPE ? 96 : 8)
      const maxZSpeed =
        CHANNELS_MAPPED_TO_MAX_SPEED[robotType][channelsForSpeed].z

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

      acc[stepId] = {
        ...form,
        aspirate_retract_speed: form.aspirate_retract_speed ?? maxZSpeed,
        dispense_retract_speed: form.dispense_retract_speed ?? maxZSpeed,
        aspirate_submerge_speed: form.aspirate_submerge_speed ?? maxZSpeed,
        dispense_submerge_speed: form.dispense_submerge_speed ?? maxZSpeed,
      }
    }
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
