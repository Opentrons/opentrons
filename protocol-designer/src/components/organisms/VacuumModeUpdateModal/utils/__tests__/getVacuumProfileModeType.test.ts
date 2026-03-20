import { describe, expect, it } from 'vitest'

import { VACUUM_MODE_PRESSURE } from '@opentrons/step-generation'

import { PROFILE_CYCLE, PROFILE_STEP } from '/protocol-designer/form-types'

import { getVacuumProfileModeType } from '../getVacuumProfileModeType'

import type {
  VacuumProfileCycle,
  VacuumProfileStep,
} from '/protocol-designer/form-types'

describe('getVacuumProfileModeType', () => {
  it('should return the mode type of the first cycle item if the item is a step', () => {
    const profileItem = {
      type: PROFILE_STEP,
      pumpData: { mode: VACUUM_MODE_PRESSURE },
    } as VacuumProfileStep
    const result = getVacuumProfileModeType(profileItem)
    expect(result).toBe(VACUUM_MODE_PRESSURE)
  })

  it('should return the mode type of the first cycle step if the item is a cycle', () => {
    const profileItem = {
      type: PROFILE_CYCLE,
      orderedProfileStepIds: ['step-1'],
      profileStepItemsById: {
        'step-1': {
          pumpData: { mode: VACUUM_MODE_PRESSURE },
        },
      },
    } as unknown as VacuumProfileCycle
    const result = getVacuumProfileModeType(profileItem)
    expect(result).toBe(VACUUM_MODE_PRESSURE)
  })
})
