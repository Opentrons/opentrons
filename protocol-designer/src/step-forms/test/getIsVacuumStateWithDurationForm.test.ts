import { describe, expect, it } from 'vitest'

import {
  VACUUM_PROGRAM_PROFILE,
  VACUUM_PROGRAM_STATE,
} from '@opentrons/step-generation'

import { getIsVacuumStateWithDurationForm } from '../utils/getIsVacuumStateWithDurationForm'

import type { FormData } from '/protocol-designer/form-types'

const baseVacuumForm = {
  stepType: 'vacuum' as const,
  id: 'vacuum-step-1',
  moduleId: 'vacuum-module-1',
  programType: VACUUM_PROGRAM_STATE,
  pumpDurationCheckbox: true,
  pumpDurationTime: '00:01:00',
} as const satisfies Partial<FormData>

describe('getIsVacuumStateWithDurationForm', () => {
  it('returns true for vacuum state program with pump duration enabled and a time set', () => {
    expect(getIsVacuumStateWithDurationForm(baseVacuumForm as FormData)).toBe(
      true
    )
  })

  it('returns false when form is null', () => {
    expect(getIsVacuumStateWithDurationForm(null)).toBe(false)
  })

  it('returns false when not vacuum state with duration (wrong program or duration off)', () => {
    expect(
      getIsVacuumStateWithDurationForm({
        ...baseVacuumForm,
        programType: VACUUM_PROGRAM_PROFILE,
      } as FormData)
    ).toBe(false)

    expect(
      getIsVacuumStateWithDurationForm({
        ...baseVacuumForm,
        pumpDurationCheckbox: false,
      } as FormData)
    ).toBe(false)

    expect(
      getIsVacuumStateWithDurationForm({
        ...baseVacuumForm,
        pumpDurationTime: null,
      } as FormData)
    ).toBe(false)
  })
})
