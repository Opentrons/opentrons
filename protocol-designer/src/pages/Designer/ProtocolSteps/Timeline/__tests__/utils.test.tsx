import { describe, expect, it } from 'vitest'

import {
  capitalizeFirstLetterAfterNumber,
  getShiftSelectedSteps,
} from '../utils'

import type { StepHierarchy } from '/protocol-designer/steplist/utils/stepHierarchy'

describe('capitalizeFirstLetterAfterNumber', () => {
  it('should capitalize the first letter of a step type', () => {
    expect(capitalizeFirstLetterAfterNumber('1. heater-shaker')).toBe(
      '1. Heater-Shaker'
    )
    expect(capitalizeFirstLetterAfterNumber('22. thermocycler')).toBe(
      '22. Thermocycler'
    )
  })
})

describe('getShiftSelectedSteps', () => {
  it('should return a single step if no steps were selected before', () => {
    const stepHierarchy: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'step1' },
        { type: 'standaloneStep', stepId: 'step2' },
        { type: 'standaloneStep', stepId: 'step3' },
      ],
    }
    expect(
      getShiftSelectedSteps(null, stepHierarchy, 'step2', null, null)
    ).toStrictEqual(['step2'])
  })
  it('should return a range if a single step was selected before', () => {
    const stepHierarchy: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'step1' },
        {
          type: 'thermocyclerProfileGroup',
          thermocyclerProfileStepId: 'step2',
          concurrentSteps: [
            { type: 'standaloneStep', stepId: 'step3' },
            { type: 'standaloneStep', stepId: 'step4' },
          ],
          waitForThermocyclerProfileStepId: 'step5',
        },
        { type: 'standaloneStep', stepId: 'step6' },
        { type: 'standaloneStep', stepId: 'step7' },
      ],
    }
    expect(
      getShiftSelectedSteps('step3', stepHierarchy, 'step7', null, null)
    ).toStrictEqual([
      'step3',
      'step4',
      // step5 should be skipped because it's hidden in the UI
      'step6',
      'step7',
    ])
  })
  it('should return a range if multiple steps were selected before', () => {
    const stepHierarchy: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'step1' },
        {
          type: 'thermocyclerProfileGroup',
          thermocyclerProfileStepId: 'step2',
          concurrentSteps: [
            { type: 'standaloneStep', stepId: 'step3' },
            { type: 'standaloneStep', stepId: 'step4' },
          ],
          waitForThermocyclerProfileStepId: 'step5',
        },
        { type: 'standaloneStep', stepId: 'step6' },
        { type: 'standaloneStep', stepId: 'step7' },
      ],
    }
    expect(
      getShiftSelectedSteps(
        null,
        stepHierarchy,
        'step7',
        ['step2', 'step3'],
        'step3'
      )
    ).toStrictEqual([
      'step2',
      'step3',
      'step4',
      // step5 should be skipped because it's hidden in the UI
      'step6',
      'step7',
    ])
  })
})
