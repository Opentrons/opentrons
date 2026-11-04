import { describe, expect, it } from 'vitest'

import {
  getStepsToSelectAfterDuplication,
  getStepToSelectAfterDeletion,
} from '../utils/getStepsToSelect'

import type { StepIdType } from '/protocol-designer/form-types'
import type { StepHierarchy } from '../utils/stepHierarchy'

describe('getStepToSelectAfterDeletion', () => {
  type Result = ReturnType<typeof getStepToSelectAfterDeletion>

  it('should generally return the first step after the last deleted step', () => {
    expect(
      getStepToSelectAfterDeletion(
        {
          topLevelItems: [
            { type: 'standaloneStep', stepId: '1' },
            { type: 'standaloneStep', stepId: '2' },
            { type: 'standaloneStep', stepId: '3' },
            { type: 'standaloneStep', stepId: '4' },
            { type: 'standaloneStep', stepId: '5' },
            { type: 'standaloneStep', stepId: '6' },
          ],
        },
        new Set(['2', '4'])
      )
    ).toStrictEqual('5' satisfies Result)
  })

  it('should return the highest step it can, if there are no steps after the last deleted step', () => {
    expect(
      getStepToSelectAfterDeletion(
        {
          topLevelItems: [
            { type: 'standaloneStep', stepId: '1' },
            { type: 'standaloneStep', stepId: '2' },
            { type: 'standaloneStep', stepId: '3' },
            { type: 'standaloneStep', stepId: '4' },
            { type: 'standaloneStep', stepId: '5' },
            { type: 'standaloneStep', stepId: '6' },
          ],
        },
        new Set(['6'])
      )
    ).toStrictEqual('5' satisfies Result)

    expect(
      getStepToSelectAfterDeletion(
        {
          topLevelItems: [
            { type: 'standaloneStep', stepId: '1' },
            { type: 'standaloneStep', stepId: '2' },
            { type: 'standaloneStep', stepId: '3' },
            { type: 'standaloneStep', stepId: '4' },
            { type: 'standaloneStep', stepId: '5' },
            { type: 'standaloneStep', stepId: '6' },
          ],
        },
        new Set(['3', '5', '6'])
      )
    ).toStrictEqual('4' satisfies Result)
  })

  it('should never return the implicit step at the end of a Thermocycler profile group', () => {
    expect(
      getStepToSelectAfterDeletion(
        {
          topLevelItems: [
            { type: 'standaloneStep', stepId: '1' },
            {
              type: 'thermocyclerProfileGroup',
              startStepId: '2',
              concurrentSteps: [{ type: 'standaloneStep', stepId: '3' }],
              waitStepId: '4',
            },
            { type: 'standaloneStep', stepId: '5' },
          ],
        },
        new Set(['3'])
      )
      // 4 isn't valid. It should should skip past 4 and return 5.
    ).toStrictEqual('5' satisfies Result)

    expect(
      getStepToSelectAfterDeletion(
        {
          topLevelItems: [
            { type: 'standaloneStep', stepId: '1' },
            {
              type: 'thermocyclerProfileGroup',
              startStepId: '2',
              concurrentSteps: [{ type: 'standaloneStep', stepId: '3' }],
              waitStepId: '4',
            },
          ],
        },
        new Set(['3'])
      )
      // 4 isn't valid and there's nothing after 4. It should go backwards and return 2.
    ).toStrictEqual('2' satisfies Result)
  })

  it('should return null if all steps are being deleted', () => {
    expect(
      getStepToSelectAfterDeletion(
        {
          topLevelItems: [
            { type: 'standaloneStep', stepId: '1' },
            { type: 'standaloneStep', stepId: '2' },
            { type: 'standaloneStep', stepId: '3' },
          ],
        },
        new Set(['1', '2', '3'])
      )
    ).toStrictEqual(null satisfies Result)
  })

  it('should return null for empty inputs', () => {
    const emptyStepHierarchy: StepHierarchy = {
      topLevelItems: [],
    }
    const nonEmptyStepHierarchy: StepHierarchy = {
      topLevelItems: [{ type: 'standaloneStep', stepId: '1' }],
    }
    const emptyStepsToDelete = new Set<StepIdType>()
    const nonEmptyStepsToDelete = new Set<StepIdType>(['1'])

    expect(
      getStepToSelectAfterDeletion(emptyStepHierarchy, emptyStepsToDelete)
    ).toStrictEqual(null satisfies Result)
    expect(
      getStepToSelectAfterDeletion(emptyStepHierarchy, nonEmptyStepsToDelete)
    ).toStrictEqual(null satisfies Result)
    expect(
      getStepToSelectAfterDeletion(nonEmptyStepHierarchy, emptyStepsToDelete)
    ).toStrictEqual(null satisfies Result)
  })
})

describe('getStepsToSelectAfterDuplication', () => {
  type Result = ReturnType<typeof getStepsToSelectAfterDuplication>

  it('should return visible duplicated steps in order, excluding implicit wait steps', () => {
    expect(
      getStepsToSelectAfterDuplication(
        {
          topLevelItems: [
            { type: 'standaloneStep', stepId: '1' },
            { type: 'standaloneStep', stepId: '2' },
            {
              type: 'thermocyclerProfileGroup',
              startStepId: '3',
              concurrentSteps: [
                { type: 'standaloneStep', stepId: '4' },
                { type: 'standaloneStep', stepId: '5' },
              ],
              waitStepId: '6',
            },
            { type: 'standaloneStep', stepId: '7' },
            {
              type: 'thermocyclerProfileGroup',
              startStepId: '8',
              concurrentSteps: [
                { type: 'standaloneStep', stepId: '9' },
                { type: 'standaloneStep', stepId: '10' },
              ],
              waitStepId: '11',
            },
            { type: 'standaloneStep', stepId: '12' },
          ],
        },
        new Set([
          '1', // top-level step
          '3', // Thermocycler profile step
          '6', // Thermocycler wait-for-profile step
          '9', // step inside a Thermocycler group
        ])
      )
      // Should omit '6', the Thermocyler wait-for-profile step, because it's not user-visible.
    ).toStrictEqual(['1', '3', '9'] satisfies Result)
  })
})
