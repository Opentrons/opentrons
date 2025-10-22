import { describe, expect, it, test } from 'vitest'

import {
  PAUSE_UNTIL_TC_PROFILE_COMPLETE,
  THERMOCYCLER_PROFILE,
} from '/protocol-designer/constants'

import {
  computeStepMove,
  convertStepArrayToHierarchy,
  convertStepHierarchyToArray,
} from '../concurrentStepGroupUtils'

import type { FormData } from '/protocol-designer/form-types'
import type { StepHierarchy } from '../concurrentStepGroupUtils'

describe('convertFlatStepArrayToHierarchy() and convertStepHierarchyToFlatArray()', () => {
  test.each([
    { label: 'empty', flat: [], hierarchy: { topLevelItems: [] } },
    {
      label: 'only top-level',
      flat: [
        {
          id: 'a',
          stepType: 'comment',
        },
        {
          id: 'b',
          stepType: 'comment',
        },
        {
          id: 'c',
          stepType: 'comment',
        },
      ],
      hierarchy: {
        topLevelItems: [
          { type: 'standaloneStep', stepId: 'a' },
          { type: 'standaloneStep', stepId: 'b' },
          { type: 'standaloneStep', stepId: 'c' },
        ],
      },
    },
    {
      label: 'Thermocycler group in middle',
      flat: [
        {
          id: 'a',
          stepType: 'comment',
        },
        {
          id: 'b',
          stepType: 'thermocycler',
          thermocyclerFormType: THERMOCYCLER_PROFILE,
        },
        {
          id: 'c',
          stepType: 'comment',
        },
        {
          id: 'd',
          stepType: 'comment',
        },
        {
          id: 'e',
          stepType: 'pause',
          pauseAction: PAUSE_UNTIL_TC_PROFILE_COMPLETE,
        },
        {
          id: 'f',
          stepType: 'comment',
        },
      ],
      hierarchy: {
        topLevelItems: [
          { type: 'standaloneStep', stepId: 'a' },
          {
            type: 'thermocyclerProfileGroup',
            thermocyclerProfileStepId: 'b',
            concurrentSteps: [
              { type: 'standaloneStep', stepId: 'c' },
              { type: 'standaloneStep', stepId: 'd' },
            ],
            waitForThermocyclerProfileStepId: 'e',
          },
          { type: 'standaloneStep', stepId: 'f' },
        ],
      },
    },
    {
      label: 'empty Thermocycler group at end',
      flat: [
        {
          id: 'a',
          stepType: 'comment',
        },
        {
          id: 'b',
          stepType: 'comment',
        },
        {
          id: 'c',
          stepType: 'comment',
        },
        {
          id: 'd',
          stepType: 'comment',
        },
        {
          id: 'e',
          stepType: 'thermocycler',
          thermocyclerFormType: THERMOCYCLER_PROFILE,
        },
        {
          id: 'f',
          stepType: 'pause',
          pauseAction: PAUSE_UNTIL_TC_PROFILE_COMPLETE,
        },
      ],
      hierarchy: {
        topLevelItems: [
          { type: 'standaloneStep', stepId: 'a' },
          { type: 'standaloneStep', stepId: 'b' },
          { type: 'standaloneStep', stepId: 'c' },
          { type: 'standaloneStep', stepId: 'd' },
          {
            type: 'thermocyclerProfileGroup',
            thermocyclerProfileStepId: 'e',
            concurrentSteps: [],
            waitForThermocyclerProfileStepId: 'f',
          },
        ],
      },
    },
  ] satisfies Array<{
    label: string
    flat: FormData[]
    hierarchy: StepHierarchy
  }>)('$label', ({ flat, hierarchy }) => {
    const hierarchyResult = convertStepArrayToHierarchy(flat, true)
    expect(hierarchyResult).toStrictEqual(hierarchy)
    const flatResult = convertStepHierarchyToArray(hierarchyResult)
    expect(flatResult).toStrictEqual(flat.map(element => element.id))
  })
})

describe('computeStepMove()', () => {
  it('can move a step before another step', () => {
    // TODO: Implement this test.
  })
  it('can move a step to the end of a Thermocycler group', () => {
    const originalHierarchy: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: 'a',
        },
        {
          type: 'thermocyclerProfileGroup',
          thermocyclerProfileStepId: 'b',
          concurrentSteps: [],
          waitForThermocyclerProfileStepId: 'c',
        },
        {
          type: 'standaloneStep',
          stepId: 'd',
        },
      ],
    }
    const result = computeStepMove(originalHierarchy, {
      moveType: 'insertAsLastStepOfGroup',
      movedStepId: 'a',
      destinationGroupRootStepId: 'b',
    })
    const expectedResult: typeof result = {
      isMoveAllowed: true,
      stepsAfterMove: {
        topLevelItems: [
          {
            type: 'thermocyclerProfileGroup',
            thermocyclerProfileStepId: 'b',
            concurrentSteps: [{ type: 'standaloneStep', stepId: 'a' }],
            waitForThermocyclerProfileStepId: 'c',
          },
          {
            type: 'standaloneStep',
            stepId: 'd',
          },
        ],
      },
    }
    expect(result).toStrictEqual(expectedResult)
  })
  it('can move an entire Thermocycler group', () => {
    // TODO: Implement this test.
  })
  it('allows moving a step to itself, as a no-op', () => {
    // TODO: Implement this test.
  })
})
