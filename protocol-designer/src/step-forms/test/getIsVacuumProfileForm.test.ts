import { describe, expect, it } from 'vitest'

import {
  VACUUM_PROGRAM_PROFILE,
  VACUUM_PROGRAM_STATE,
} from '@opentrons/step-generation'

import { getIsVacuumProfileForm } from '../utils/getIsVacuumProfileForm'

import type { FormData } from '/protocol-designer/form-types'

const baseVacuumForm = {
  stepType: 'vacuum' as const,
  id: 'vacuum-step-1',
  moduleId: 'vacuum-module-1',
  programType: VACUUM_PROGRAM_PROFILE,
} as const satisfies Partial<FormData>

describe('getIsVacuumProfileForm', () => {
  it('returns true for vacuum step with profile program type', () => {
    expect(getIsVacuumProfileForm(baseVacuumForm as FormData)).toBe(true)
  })

  it('returns false when form is null', () => {
    expect(getIsVacuumProfileForm(null)).toBe(false)
  })

  it('returns false when vacuum uses state program or step is not vacuum', () => {
    expect(
      getIsVacuumProfileForm({
        ...baseVacuumForm,
        programType: VACUUM_PROGRAM_STATE,
      } as FormData)
    ).toBe(false)

    expect(
      getIsVacuumProfileForm({
        id: 'c',
        stepType: 'comment',
      } as FormData)
    ).toBe(false)
  })
})
