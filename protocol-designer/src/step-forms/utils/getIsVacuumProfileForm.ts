import { VACUUM_PROGRAM_PROFILE } from '@opentrons/step-generation'

import type { FormData } from '/protocol-designer/form-types'

export function getIsVacuumProfileForm(formData: FormData | null): boolean {
  return (
    formData?.stepType === 'vacuum' &&
    formData.programType === VACUUM_PROGRAM_PROFILE
  )
}
