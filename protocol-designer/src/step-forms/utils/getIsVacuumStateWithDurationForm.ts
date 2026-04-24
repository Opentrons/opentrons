import { VACUUM_PROGRAM_STATE } from '@opentrons/step-generation'

import type { FormData } from '/protocol-designer/form-types'

/**
 * Vacuum "state" program with a pump duration enables concurrent steps until the
 * implicit "wait for vacuum" pause (see `StepHierarchy`).
 */
export function getIsVacuumStateWithDurationForm(
  formData: FormData | null
): boolean {
  if (formData?.stepType !== 'vacuum') {
    return false
  }
  if (formData.programType !== VACUUM_PROGRAM_STATE) {
    return false
  }
  return (
    formData.pumpDurationCheckbox === true && formData.pumpDurationTime != null
  )
}
