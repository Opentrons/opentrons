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
  percentPower: 50,
  pumpDurationCheckbox: true,
  pumpDurationTime: '1:00',
  endingHoldVentCheckbox: true,
  vacuumOrderedProfileIds: ['1'],
  vacuumProfileItemsById: {
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
      percentPower: null,
      pumpDurationCheckbox: null,
      pumpDurationTime: null,
      endingHoldVentCheckbox: null,
      vacuumOrderedProfileIds: [],
      vacuumProfileItemsById: {},
    })
  })

  it('should update the patch on state type', () => {
    expect(
      dependentFieldsUpdateVacuum({ stateType: 'vent' }, formData)
    ).toEqual({
      stateType: 'vent',
      modeType: null,
      pressureMbar: null,
      percentPower: null,
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
      percentPower: null,
      pumpDurationCheckbox: null,
      pumpDurationTime: null,
    })
  })

  it('sets endingHoldVentCheckbox when pump duration is enabled', () => {
    const stateForm: FormData = {
      ...formData,
      programType: 'state',
      pumpDurationCheckbox: false,
      endingHoldVentCheckbox: false,
    }
    expect(
      dependentFieldsUpdateVacuum({ pumpDurationCheckbox: true }, stateForm)
    ).toEqual({
      pumpDurationCheckbox: true,
      endingHoldVentCheckbox: true,
    })
  })

  it('does not set endingHoldVentCheckbox when pump duration is disabled', () => {
    const stateForm: FormData = {
      ...formData,
      programType: 'state',
      pumpDurationCheckbox: true,
      endingHoldVentCheckbox: true,
    }
    expect(
      dependentFieldsUpdateVacuum({ pumpDurationCheckbox: false }, stateForm)
    ).toEqual({
      pumpDurationCheckbox: false,
    })
  })
})
