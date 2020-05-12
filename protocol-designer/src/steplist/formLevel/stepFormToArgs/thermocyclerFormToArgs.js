// @flow
import { THERMOCYCLER_STATE, THERMOCYCLER_PROFILE } from '../../../constants'
import type { FormData } from '../../../form-types'
import type { ThermocyclerStateStepArgs } from '../../../step-generation/types'

export const thermocyclerFormToArgs = (
  formData: FormData
): ThermocyclerStateStepArgs | null => {
  const { thermocyclerFormType } = formData
  switch (thermocyclerFormType) {
    case THERMOCYCLER_STATE: {
      return {
        module: formData.moduleId,
        commandCreatorFnName: THERMOCYCLER_STATE,
        blockTargetTemp:
          formData.blockIsActive && formData.blockTargetTemp !== null
            ? Number(formData.blockTargetTemp)
            : null,
        lidTargetTemp:
          formData.lidIsActive && formData.lidTargetTemp !== null
            ? Number(formData.lidTargetTemp)
            : null,
        lidOpen: formData.lidOpen,
      }
    }
    case THERMOCYCLER_PROFILE: {
      console.warn('thermocyclerFormToArgs not yet implemented for TC Profile')
      return null
    }
  }
  // this should not happen, for Flow only
  return null
}
