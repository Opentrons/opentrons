import { THERMOCYCLER_PROFILE, THERMOCYCLER_STATE } from '../../../constants'
import { PROFILE_STEP } from '../../../form-types'

import type {
  ThermocyclerProfileStepArgs,
  ThermocyclerStateStepArgs,
} from '@opentrons/step-generation'
import type {
  HydratedThermocyclerFormData,
  ProfileItem,
  ProfileStepItem,
} from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

type FlatProfileSteps = ThermocyclerProfileStepArgs['profileSteps']

const _flattenProfileSteps = (args: {
  orderedProfileItems: string[]
  profileItemsById: Record<string, ProfileItem>
}): FlatProfileSteps => {
  const { orderedProfileItems, profileItemsById } = args
  const steps: FlatProfileSteps = []

  const addStep = (step: ProfileStepItem): void => {
    const durationMinutes = Number(step.durationMinutes) || 0
    const durationSeconds = Number(step.durationSeconds) || 0
    steps.push({
      temperature: Number(step.temperature),
      holdTime: durationMinutes * 60 + durationSeconds,
    })
  }

  for (const itemId of orderedProfileItems) {
    const item = profileItemsById[itemId]

    if (item.type === PROFILE_STEP) {
      addStep(item)
    } else {
      const repetitions = Number(item.repetitions)

      for (let i = 0; i < repetitions; i++) {
        for (const step of item.steps) {
          addStep(step)
        }
      }
    }
  }

  return steps
}

export const thermocyclerFormToArgs = (
  formData: GetCastFormData<HydratedThermocyclerFormData>
): ThermocyclerProfileStepArgs | ThermocyclerStateStepArgs => {
  const { thermocyclerFormType, stepDetails } = formData

  switch (thermocyclerFormType) {
    case THERMOCYCLER_STATE: {
      return {
        // todo(mm, 2025-10-09): form-types.ts is inconsistent about whether moduleId is nullable.
        // This runtime behavior of assuming it can't be nullish here is inherited from prior code.
        // Look into this.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        moduleId: formData.moduleId!,
        commandCreatorFnName: THERMOCYCLER_STATE,
        blockTargetTemp:
          formData.blockIsActive && formData.blockTargetTemp !== null
            ? Number(formData.blockTargetTemp)
            : null,
        lidTargetTemp:
          formData.lidIsActive && formData.lidTargetTemp !== null
            ? Number(formData.lidTargetTemp)
            : null,
        // todo(mm, 2025-10-09): Nullability error inherited from prior code. Look into this.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        lidOpen: formData.lidOpen!,
      }
    }

    case THERMOCYCLER_PROFILE: {
      const profileSteps = _flattenProfileSteps({
        orderedProfileItems: formData.orderedProfileItems,
        profileItemsById: formData.profileItemsById,
      })

      return {
        // todo(mm, 2025-10-09): form-types.ts is inconsistent about whether moduleId is nullable.
        // This runtime behavior of assuming it can't be nullish here is inherited from prior code.
        // Look into this.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        moduleId: formData.moduleId!,
        commandCreatorFnName: THERMOCYCLER_PROFILE,
        blockTargetTempHold:
          formData.blockIsActiveHold && formData.blockTargetTempHold !== null
            ? Number(formData.blockTargetTempHold)
            : null,
        lidOpenHold: formData.lidOpenHold,
        lidTargetTempHold:
          formData.lidIsActiveHold && formData.lidTargetTempHold !== null
            ? Number(formData.lidTargetTempHold)
            : null,
        meta: {
          rawProfileItems: formData.orderedProfileItems.map(
            (itemId: string | number) => formData.profileItemsById[itemId]
          ),
        },
        profileSteps,
        profileTargetLidTemp: Number(formData.profileTargetLidTemp),
        profileVolume: Number(formData.profileVolume),
        description: stepDetails,
      }
    }
  }
}
