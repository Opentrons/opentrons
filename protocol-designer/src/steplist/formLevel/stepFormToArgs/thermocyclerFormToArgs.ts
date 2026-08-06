import { THERMOCYCLER_PROFILE, THERMOCYCLER_STATE } from '../../../constants'
import { PROFILE_STEP } from '../../../form-types'

import type { AtomicProfileStep } from '@opentrons/shared-data'
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

const _convertToProfileElements = (args: {
  orderedProfileItems: string[]
  profileItemsById: Record<string, ProfileItem>
}): ThermocyclerProfileStepArgs['profileElements'] => {
  const { orderedProfileItems, profileItemsById } = args

  const convertStep = (step: ProfileStepItem): AtomicProfileStep => {
    const durationMinutes = Number(step.durationMinutes) || 0
    const durationSeconds = Number(step.durationSeconds) || 0
    return {
      celsius: Number(step.temperature),
      holdSeconds: durationMinutes * 60 + durationSeconds,
    }
  }

  return orderedProfileItems.map(itemId => {
    const item = profileItemsById[itemId]
    return item.type === PROFILE_STEP
      ? convertStep(item)
      : {
          steps: item.steps.map(convertStep),
          repetitions: Number(item.repetitions),
        }
  })
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
      const profileItemsById = castFormData.profileItemsById
      const profileElements = _convertToProfileElements({
        orderedProfileItems: castFormData.orderedProfileItems,
        profileItemsById,
      })

      const args = {
        commandCreatorFnName: THERMOCYCLER_PROFILE,

        // todo(mm, 2025-10-09): form-types.ts is inconsistent about whether moduleId is nullable.
        // This runtime behavior of assuming it can't be nullish here is inherited from prior code.
        // Look into this.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        moduleId: castFormData.moduleId!,

        meta: {
          rawProfileItems: castFormData.orderedProfileItems.map(
            (itemId: string | number) => profileItemsById[itemId]
          ),
        },
        profileElements,
        profileTargetLidTemp: Number(castFormData.profileTargetLidTemp),
        profileVolume: Number(castFormData.profileVolume),
        description: stepDetails,
      }

      return args
    }
  }
}
