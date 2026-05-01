import { describe, expect, it } from 'vitest'

import {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
  VACUUM_PROGRAM_PROFILE,
  VACUUM_PROGRAM_STATE,
  VACUUM_STATE_PUMP_OFF,
  VACUUM_STATE_PUMP_ON,
  VACUUM_VENT_SET_CLOSED,
  VACUUM_VENT_SET_OPEN,
} from '@opentrons/step-generation'

import { PROFILE_CYCLE, PROFILE_STEP } from '/protocol-designer/form-types'

import { vacuumFormToArgs } from '../vacuumFormToArgs'

import type { VacuumArgs } from '@opentrons/step-generation'
import type { HydratedVacuumFormData } from '/protocol-designer/form-types'
import type { GetCastFormData } from '/protocol-designer/steplist/fieldLevel'

const moduleId = 'vacuumModuleId'

const annotation = {
  stepNumber: 1,
  stepName: 'vacuum step',
  stepDetails: 'step details text',
}

const baseStateForm = (
  overrides: Partial<GetCastFormData<HydratedVacuumFormData>> = {}
): GetCastFormData<HydratedVacuumFormData> => ({
  ...annotation,
  stepType: 'vacuum',
  id: 'vacuumStepId',
  moduleId,
  programType: VACUUM_PROGRAM_STATE,
  stateType: VACUUM_STATE_PUMP_ON,
  modeType: VACUUM_MODE_PRESSURE,
  pressureMbar: 100,
  powerPercent: null,
  pumpDurationCheckbox: false,
  pumpDurationTime: null,
  endingHoldVentCheckbox: false,
  vacuumOrderedProfileIds: [],
  vacuumProfileItemsById: {},
  ...overrides,
})

describe('vacuumFormToArgs', () => {
  it('returns null when moduleId is missing', () => {
    const formData = {
      ...baseStateForm(),
      moduleId: null,
    } as unknown as GetCastFormData<HydratedVacuumFormData>
    expect(vacuumFormToArgs(formData)).toBeNull()
  })

  it('returns null when programType is not recognized', () => {
    const formData = {
      ...baseStateForm(),
      programType: 'notARealProgram',
    } as unknown as GetCastFormData<HydratedVacuumFormData>
    expect(vacuumFormToArgs(formData)).toBeNull()
  })

  it('returns null when program is state but stateType is not handled', () => {
    const formData = {
      ...baseStateForm(),
      stateType: 'notPumpOrVent',
    } as unknown as GetCastFormData<HydratedVacuumFormData>
    expect(vacuumFormToArgs(formData)).toBeNull()
  })

  it('maps pump + pressure mode to vacuumSetPumpPressure args', () => {
    const formData = baseStateForm({
      stateType: VACUUM_STATE_PUMP_ON,
      modeType: VACUUM_MODE_PRESSURE,
      pressureMbar: 250.5,
      powerPercent: null,
    })
    const expected: VacuumArgs = {
      commandCreatorFnName: 'vacuumSetPumpPressure',
      moduleId,
      name: annotation.stepName,
      description: annotation.stepDetails,
      gaugePressure: 250.5,
    }
    expect(vacuumFormToArgs(formData)).toEqual(expected)
  })

  it('maps pump + power mode to vacuumSetPumpPower args', () => {
    const formData = baseStateForm({
      stateType: VACUUM_STATE_PUMP_ON,
      modeType: VACUUM_MODE_POWER,
      pressureMbar: null,
      powerPercent: 75,
    })
    const expected: VacuumArgs = {
      commandCreatorFnName: 'vacuumSetPumpPower',
      moduleId,
      name: annotation.stepName,
      description: annotation.stepDetails,
      powerPercent: 75,
    }
    expect(vacuumFormToArgs(formData)).toEqual(expected)
  })

  it('includes pump duration and ventAfter when duration checkbox and time are set', () => {
    const formData = baseStateForm({
      modeType: VACUUM_MODE_PRESSURE,
      pressureMbar: 10,
      pumpDurationCheckbox: true,
      pumpDurationTime: '01:02:03',
      endingHoldVentCheckbox: true,
    })
    const expected: VacuumArgs = {
      commandCreatorFnName: 'vacuumSetPumpPressure',
      moduleId,
      name: annotation.stepName,
      description: annotation.stepDetails,
      gaugePressure: 10,
      duration: 3600 + 2 * 60 + 3,
      ventAfter: true,
    }
    expect(vacuumFormToArgs(formData)).toEqual(expected)
  })

  it('sets ventAfter false when ending hold vent checkbox is off', () => {
    const formData = baseStateForm({
      modeType: VACUUM_MODE_POWER,
      powerPercent: 50,
      pumpDurationCheckbox: true,
      pumpDurationTime: '0:1:0',
      endingHoldVentCheckbox: false,
    })
    const expected: VacuumArgs = {
      commandCreatorFnName: 'vacuumSetPumpPower',
      moduleId,
      name: annotation.stepName,
      description: annotation.stepDetails,
      powerPercent: 50,
      duration: 60,
      ventAfter: false,
    }
    expect(vacuumFormToArgs(formData)).toEqual(expected)
  })

  it('omits duration fields when pump duration checkbox is true but time is missing', () => {
    const formData = baseStateForm({
      pumpDurationCheckbox: true,
      pumpDurationTime: null,
    })
    const expected: VacuumArgs = {
      commandCreatorFnName: 'vacuumSetPumpPressure',
      moduleId,
      name: annotation.stepName,
      description: annotation.stepDetails,
      gaugePressure: 100,
    }
    expect(vacuumFormToArgs(formData)).toEqual(expected)
  })

  it('maps open vent state to vacuumOpenVent args', () => {
    const formData = baseStateForm({
      stateType: VACUUM_VENT_SET_OPEN,
    })
    const expected: VacuumArgs = {
      commandCreatorFnName: 'vacuumOpenVent',
      moduleId,
      name: annotation.stepName,
      description: annotation.stepDetails,
    }
    expect(vacuumFormToArgs(formData)).toEqual(expected)
  })

  it('maps closed vent state to vacuumCloseVent args', () => {
    const formData = baseStateForm({
      stateType: VACUUM_VENT_SET_CLOSED,
    })
    const expected: VacuumArgs = {
      commandCreatorFnName: 'vacuumCloseVent',
      moduleId,
      name: annotation.stepName,
      description: annotation.stepDetails,
    }
    expect(vacuumFormToArgs(formData)).toEqual(expected)
  })

  it('maps profile program to vacuumProfile with steps and cycles', () => {
    const stepAId = 'stepA'
    const stepBId = 'stepB'
    const cycleId = 'cycle1'
    const formData = baseStateForm({
      programType: VACUUM_PROGRAM_PROFILE,
      stateType: null,
      modeType: null,
      pressureMbar: null,
      powerPercent: null,
      vacuumOrderedProfileIds: [stepAId, cycleId],
      vacuumProfileItemsById: {
        [stepAId]: {
          type: PROFILE_STEP,
          id: stepAId,
          title: 'Hold',
          time: '0:0:45',
          pumpData: {
            mode: VACUUM_MODE_PRESSURE,
            pressureMbar: '12.5',
          },
        },
        [cycleId]: {
          type: PROFILE_CYCLE,
          id: cycleId,
          repetitions: '3',
          orderedProfileStepIds: [stepBId],
          profileStepItemsById: {
            [stepBId]: {
              type: PROFILE_STEP,
              id: stepBId,
              title: 'Pump segment',
              time: '1:30',
              pumpData: {
                mode: VACUUM_MODE_POWER,
                powerPercent: 88,
              },
            },
          },
        },
      },
    })
    const expected: VacuumArgs = {
      commandCreatorFnName: 'vacuumStartRunProfile',
      moduleId,
      name: annotation.stepName,
      description: annotation.stepDetails,
      profile: [
        { holdSeconds: 45, pressureMbar: 12.5 },
        {
          repetitions: 3,
          steps: [{ holdSeconds: 90, powerPercent: 88 }],
        },
      ],
    }
    expect(vacuumFormToArgs(formData)).toEqual(expected)
  })
  it('maps pump off state to vacuumStopPump args', () => {
    const formData = baseStateForm({
      stateType: VACUUM_STATE_PUMP_OFF,
    })
    const expected: VacuumArgs = {
      commandCreatorFnName: 'vacuumStopPump',
      moduleId,
      name: annotation.stepName,
      description: annotation.stepDetails,
    }
    expect(vacuumFormToArgs(formData)).toEqual(expected)
  })
})
