import { describe, expect, it } from 'vitest'

import { dependentFieldsUpdateVacuum } from '../dependentFieldsUpdateVacuum'

import type { FormData } from '/protocol-designer/form-types'

const formData: FormData = {
  stepType: 'vacuum',
  id: 'vacuum-step-1',
  moduleId: 'vacuum-module-1',
  programType: 'profile',
  stateType: 'pump',
  modeType: 'pressure',
  pressureMbar: 100,
  powerPercent: 50,
  pumpDurationCheckbox: true,
  pumpDurationTime: '1:00',
  endingHoldVentCheckbox: true,
  orderedProfileIds: ['1'],
  profileItemsById: {
    '1': {
      type: 'profileStep',
      id: '1',
      title: 'Step 1',
      time: '1:00',
      pumpData: { mode: 'pressure', pressureMbar: 100 },
    },
  },
}

describe('dependentFieldsUpdateVacuum', () => {
  it('should update the patch on program type', () => {
    expect(
      dependentFieldsUpdateVacuum({ programType: 'state' }, formData)
    ).toEqual({
      programType: 'state',
      stateType: null,
      modeType: null,
      pressureMbar: null,
      powerPercent: null,
      pumpDurationCheckbox: null,
      pumpDurationTime: null,
      endingHoldVentCheckbox: null,
      orderedProfileIds: [],
      profileItemsById: {},
    })
  })

  it('should update the patch on state type', () => {
    expect(
      dependentFieldsUpdateVacuum({ stateType: 'vent' }, formData)
    ).toEqual({
      stateType: 'vent',
      modeType: null,
      pressureMbar: null,
      powerPercent: null,
      pumpDurationCheckbox: null,
      pumpDurationTime: null,
      endingHoldVentCheckbox: null,
    })
  })

  it('should update the patch on mode type', () => {
    expect(
      dependentFieldsUpdateVacuum({ modeType: 'power' }, formData)
    ).toEqual({
      modeType: 'power',
      pressureMbar: null,
      powerPercent: null,
      pumpDurationCheckbox: null,
      pumpDurationTime: null,
    })
  })
})
