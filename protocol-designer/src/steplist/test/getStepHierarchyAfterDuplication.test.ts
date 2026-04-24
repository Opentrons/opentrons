import { describe, expect, it } from 'vitest'

import { getStepHierarchyAfterDuplication } from '../utils/getStepHierarchyAfterDuplication'

import type { StepHierarchy } from '../utils/stepHierarchy'

describe('getStepHierarchyAfterDuplication', () => {
  it('should duplicate steps and place them outside a Thermocycler group', () => {
    const originalStepHierarchy: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: '1',
        },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: '2',
          concurrentSteps: [
            {
              type: 'standaloneStep',
              stepId: '3',
            },
          ],
          waitStepId: '4',
        },
        {
          type: 'standaloneStep',
          stepId: '5',
        },
      ],
    }

    const expectedResult: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: '1',
        },
        {
          type: 'standaloneStep',
          stepId: '1-duplicated',
        },
        {
          type: 'standaloneStep',
          stepId: '3-duplicated',
        },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: '2',
          concurrentSteps: [
            {
              type: 'standaloneStep',
              stepId: '3',
            },
          ],
          waitStepId: '4',
        },
        {
          type: 'standaloneStep',
          stepId: '5',
        },
      ],
    }

    const result = getStepHierarchyAfterDuplication(
      originalStepHierarchy,
      { '1': '1-duplicated', '3': '3-duplicated' },
      '1'
    )
    expect(result).toStrictEqual(expectedResult)
  })

  it('should duplicate steps and place them inside a Thermocycler group', () => {
    const originalStepHierarchy: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: '1',
        },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: '2',
          concurrentSteps: [
            {
              type: 'standaloneStep',
              stepId: '3',
            },
          ],
          waitStepId: '4',
        },
        {
          type: 'standaloneStep',
          stepId: '5',
        },
      ],
    }

    const expectedResult: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: '1',
        },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: '2',
          concurrentSteps: [
            {
              type: 'standaloneStep',
              stepId: '3',
            },
            {
              type: 'standaloneStep',
              stepId: '1-duplicated',
            },
            {
              type: 'standaloneStep',
              stepId: '3-duplicated',
            },
          ],
          waitStepId: '4',
        },
        {
          type: 'standaloneStep',
          stepId: '5',
        },
      ],
    }

    const result = getStepHierarchyAfterDuplication(
      originalStepHierarchy,
      { '1': '1-duplicated', '3': '3-duplicated' },
      '3'
    )
    expect(result).toStrictEqual(expectedResult)
  })

  it('should duplicate a Thermocycler group', () => {
    const originalStepHierarchy: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: '1',
        },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: '2',
          concurrentSteps: [
            {
              type: 'standaloneStep',
              stepId: '3',
            },
          ],
          waitStepId: '4',
        },
        {
          type: 'standaloneStep',
          stepId: '5',
        },
      ],
    }

    const expectedResult: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: '1',
        },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: '2',
          concurrentSteps: [
            {
              type: 'standaloneStep',
              stepId: '3',
            },
          ],
          waitStepId: '4',
        },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: '2-duplicated',
          concurrentSteps: [],
          waitStepId: '4-duplicated',
        },
        {
          type: 'standaloneStep',
          stepId: '5',
        },
      ],
    }

    for (const insertAfter of ['2', '3', '4']) {
      const resultInsertedAtTopLevel = getStepHierarchyAfterDuplication(
        originalStepHierarchy,
        { '2': '2-duplicated', '4': '4-duplicated' },
        insertAfter
      )
      expect(resultInsertedAtTopLevel).toStrictEqual(expectedResult)
    }
  })
})
