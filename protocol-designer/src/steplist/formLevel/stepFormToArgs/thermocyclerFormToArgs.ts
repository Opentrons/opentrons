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
  castFormData: GetCastFormData<HydratedThermocyclerFormData>
): ThermocyclerProfileStepArgs | ThermocyclerStateStepArgs => {
  const { thermocyclerFormType, stepDetails } = castFormData

  switch (thermocyclerFormType) {
    case THERMOCYCLER_STATE: {
      return {
        // todo(mm, 2025-10-09): form-types.ts is inconsistent about whether moduleId is nullable.
        // This runtime behavior of assuming it can't be nullish here is inherited from prior code.
        // Look into this.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        moduleId: castFormData.moduleId!,
        commandCreatorFnName: THERMOCYCLER_STATE,
        blockTargetTemp:
          castFormData.blockIsActive && castFormData.blockTargetTemp !== null
            ? Number(castFormData.blockTargetTemp)
            : null,
        lidTargetTemp:
          castFormData.lidIsActive && castFormData.lidTargetTemp !== null
            ? Number(castFormData.lidTargetTemp)
            : null,
        // todo(mm, 2025-10-09): Nullability error inherited from prior code. Look into this.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        lidOpen: castFormData.lidOpen!,
      }
    }

    case THERMOCYCLER_PROFILE: {
      const profileSteps = _flattenProfileSteps({
        orderedProfileItems: castFormData.orderedProfileItems,
        profileItemsById: castFormData.profileItemsById,
      })

      return {
        // todo(mm, 2025-10-09): form-types.ts is inconsistent about whether moduleId is nullable.
        // This runtime behavior of assuming it can't be nullish here is inherited from prior code.
        // Look into this.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        moduleId: castFormData.moduleId!,
        commandCreatorFnName: THERMOCYCLER_PROFILE,
        blockTargetTempHold:
          castFormData.blockIsActiveHold &&
          castFormData.blockTargetTempHold !== null
            ? Number(castFormData.blockTargetTempHold)
            : null,
        lidOpenHold: castFormData.lidOpenHold,
        lidTargetTempHold:
          castFormData.lidIsActiveHold &&
          castFormData.lidTargetTempHold !== null
            ? Number(castFormData.lidTargetTempHold)
            : null,
        meta: {
          rawProfileItems: castFormData.orderedProfileItems.map(
            (itemId: string | number) => castFormData.profileItemsById[itemId]
          ),
        },
        profileSteps,
        profileTargetLidTemp: Number(castFormData.profileTargetLidTemp),
        profileVolume: Number(castFormData.profileVolume),
        description: stepDetails,
      }
    }
  }
}
