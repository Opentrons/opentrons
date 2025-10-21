import { describe, expect, it } from 'vitest'

import { heaterShakerFormToArgs } from '../heaterShakerFormToArgs'

import type { HydratedHeaterShakerFormData } from '/protocol-designer/form-types'
import type { GetCastFormData } from '/protocol-designer/steplist/fieldLevel'

describe('heaterShakerFormToArgs', () => {
  describe('with wrong (?) input types', () => {
    // todo(mm, 2025-10-09)
    // These are older tests. They pass input that, according to recently improved type
    // hints, was not actually possible for prior stages to produce.
    // We should clarify the expected input and delete these tests if it's safe to do so.
    it('returns heater shaker command creator when temp, shaking, and timer is specified', () => {
      const formData: GetCastFormData<HydratedHeaterShakerFormData> = {
        stepNumber: 1,
        stepType: 'heaterShaker',
        id: 'id',
        stepDetails: 'step details',
        moduleId: 'moduleId',
        heaterShakerSetTimer: true,
        setHeaterShakerTemperature: true,
        setShake: true,
        latchOpen: false,
        // @ts-expect-error See comment above.
        targetHeaterShakerTemperature: '40',
        // @ts-expect-error See comment above.
        targetSpeed: '400',
        heaterShakerTimer: '1:10',
        stepName: 'heater shaker step',
      }

      const expected = {
        commandCreatorFnName: 'heaterShaker',
        moduleId: 'moduleId',
        targetTemperature: 40,
        rpm: 400,
        latchOpen: false,
        timerHours: 0,
        timerMinutes: 1,
        timerSeconds: 10,
        name: 'heater shaker step',
        description: 'step details',
      }
      expect(heaterShakerFormToArgs(formData)).toEqual(expected)
    })
    it('return heater shaker command creator when only temp is specified', () => {
      const formData: GetCastFormData<HydratedHeaterShakerFormData> = {
        stepNumber: 1,
        stepType: 'heaterShaker',
        id: 'id',
        stepDetails: 'step details',
        moduleId: 'moduleId',
        heaterShakerSetTimer: false,
        setHeaterShakerTemperature: true,
        setShake: false,
        latchOpen: false,
        // @ts-expect-error See comment above.
        targetHeaterShakerTemperature: '40',
        // @ts-expect-error See comment above.
        targetSpeed: null,
        // @ts-expect-error See comment above.
        heaterShakerTimer: null,
        stepName: 'heater shaker step',
      }

      const expected = {
        commandCreatorFnName: 'heaterShaker',
        moduleId: 'moduleId',
        targetTemperature: 40,
        rpm: null,
        latchOpen: false,
        timerHours: null,
        timerMinutes: null,
        timerSeconds: null,
        name: 'heater shaker step',
        description: 'step details',
      }
      expect(heaterShakerFormToArgs(formData)).toEqual(expected)
    })
  })

  it('returns heater shaker command creator when temp, shaking, and timer is specified', () => {
    const formData: GetCastFormData<HydratedHeaterShakerFormData> = {
      stepNumber: 1,
      stepType: 'heaterShaker',
      id: 'id',
      stepDetails: 'step details',
      moduleId: 'moduleId',
      heaterShakerSetTimer: true,
      setHeaterShakerTemperature: true,
      setShake: true,
      latchOpen: false,
      targetHeaterShakerTemperature: 40,
      targetSpeed: 400,
      heaterShakerTimer: '1:10',
      stepName: 'heater shaker step',
    }

    const expected = {
      commandCreatorFnName: 'heaterShaker',
      moduleId: 'moduleId',
      targetTemperature: 40,
      rpm: 400,
      latchOpen: false,
      timerHours: 0,
      timerMinutes: 1,
      timerSeconds: 10,
      name: 'heater shaker step',
      description: 'step details',
    }
    expect(heaterShakerFormToArgs(formData)).toEqual(expected)
  })

  it('return heater shaker command creator when only temp is specified', () => {
    const formData: GetCastFormData<HydratedHeaterShakerFormData> = {
      stepNumber: 1,
      stepType: 'heaterShaker',
      id: 'id',
      stepDetails: 'step details',
      moduleId: 'moduleId',
      heaterShakerSetTimer: false,
      setHeaterShakerTemperature: true,
      setShake: false,
      latchOpen: false,
      targetHeaterShakerTemperature: 40,
      targetSpeed: Number(null), // = 0. Based on what I think was the actual runtime behavior, not sure if this is actually what the input was intended to look like.
      heaterShakerTimer: String(null), // = "null". Based on what I think was the actual runtime behavior, not sure if this is actually what the input was intended to look like.
      stepName: 'heater shaker step',
    }

    const expected = {
      commandCreatorFnName: 'heaterShaker',
      moduleId: 'moduleId',
      targetTemperature: 40,
      rpm: null,
      latchOpen: false,
      timerHours: null,
      timerMinutes: null,
      timerSeconds: null,
      name: 'heater shaker step',
      description: 'step details',
    }
    expect(heaterShakerFormToArgs(formData)).toEqual(expected)
  })
})
