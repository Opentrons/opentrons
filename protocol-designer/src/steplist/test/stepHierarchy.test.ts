import { describe, expect, it, test } from 'vitest'

import { VACUUM_PROGRAM_STATE } from '@opentrons/step-generation'

import {
  PAUSE_UNTIL_TC_PROFILE_COMPLETE,
  PAUSE_UNTIL_VACUUM_STATE_COMPLETE,
  THERMOCYCLER_PROFILE,
} from '/protocol-designer/constants'
import {
  computeStepMove,
  computeStepSwap,
  convertStepArrayToHierarchy,
  convertStepHierarchyToArray,
  findStep,
  getPairedSteps,
} from '/protocol-designer/steplist/utils/stepHierarchy'

import type { FormData } from '/protocol-designer/form-types'
import type {
  StandaloneStep,
  StepHierarchy,
  ThermocyclerProfileGroup,
} from '/protocol-designer/steplist/utils/stepHierarchy'

describe('convertFlatStepArrayToHierarchy() and convertStepHierarchyToFlatArray()', () => {
  test.each([
    { label: 'empty', flat: [], hierarchy: { topLevelItems: [] } },
    {
      label: 'only top-level steps, no groups',
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
            startStepId: 'b',
            concurrentSteps: [
              { type: 'standaloneStep', stepId: 'c' },
              { type: 'standaloneStep', stepId: 'd' },
            ],
            waitStepId: 'e',
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
            startStepId: 'e',
            concurrentSteps: [],
            waitStepId: 'f',
          },
        ],
      },
    },
    {
      label: 'timed Vacuum state group with concurrent steps',
      flat: [
        { id: 'a', stepType: 'comment' },
        {
          id: 'b',
          stepType: 'vacuum',
          programType: VACUUM_PROGRAM_STATE,
          pumpDurationCheckbox: true,
          pumpDurationTime: '00:01:00',
        },
        { id: 'c', stepType: 'comment' },
        { id: 'd', stepType: 'comment' },
        {
          id: 'e',
          stepType: 'pause',
          pauseAction: PAUSE_UNTIL_VACUUM_STATE_COMPLETE,
        },
        { id: 'f', stepType: 'comment' },
      ],
      hierarchy: {
        topLevelItems: [
          { type: 'standaloneStep', stepId: 'a' },
          {
            type: 'vacuumStateDurationGroup',
            startStepId: 'b',
            concurrentSteps: [
              { type: 'standaloneStep', stepId: 'c' },
              { type: 'standaloneStep', stepId: 'd' },
            ],
            waitStepId: 'e',
          },
          { type: 'standaloneStep', stepId: 'f' },
        ],
      },
    },
  ] satisfies Array<{
    label: string
    flat: FormData[]
    hierarchy: StepHierarchy
  }>)('$label', ({ flat, hierarchy }) => {
    const hierarchyResult = convertStepArrayToHierarchy(flat)
    expect(hierarchyResult).toStrictEqual(hierarchy)
    const flatResult = convertStepHierarchyToArray(hierarchyResult)
    expect(flatResult).toStrictEqual(flat.map(element => element.id))
  })
})

describe('computeStepMove()', () => {
  it('can move a step before another step', () => {
    const originalHierarchy: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: 'a',
        },
        {
          type: 'standaloneStep',
          stepId: 'b',
        },
        {
          type: 'standaloneStep',
          stepId: 'c',
        },
      ],
    }
    const result = computeStepMove(originalHierarchy, {
      moveType: 'insertBeforeDestinationStep',
      movedStepId: 'b',
      destinationStepId: 'a',
    })
    const expectedResult: typeof result = {
      isMoveAllowed: true,
      stepsAfterMove: {
        topLevelItems: [
          {
            type: 'standaloneStep',
            stepId: 'b',
          },
          {
            type: 'standaloneStep',
            stepId: 'a',
          },
          {
            type: 'standaloneStep',
            stepId: 'c',
          },
        ],
      },
    }
    expect(result).toStrictEqual(expectedResult)
  })

  it("can move a step that's inside a group to before another step that's inside a different group", () => {
    const originalHierarchy: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: 'a',
        },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: 'b',
          concurrentSteps: [
            { type: 'standaloneStep', stepId: 'c' },
            { type: 'standaloneStep', stepId: 'd' },
          ],
          waitStepId: 'e',
        },
        {
          type: 'standaloneStep',
          stepId: 'f',
        },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: 'g',
          concurrentSteps: [{ type: 'standaloneStep', stepId: 'h' }],
          waitStepId: 'i',
        },
        {
          type: 'standaloneStep',
          stepId: 'j',
        },
      ],
    }
    const result = computeStepMove(originalHierarchy, {
      moveType: 'insertBeforeDestinationStep',
      movedStepId: 'd',
      destinationStepId: 'h',
    })
    const expectedResult: typeof result = {
      isMoveAllowed: true,
      stepsAfterMove: {
        topLevelItems: [
          {
            type: 'standaloneStep',
            stepId: 'a',
          },
          {
            type: 'thermocyclerProfileGroup',
            startStepId: 'b',
            concurrentSteps: [{ type: 'standaloneStep', stepId: 'c' }],
            waitStepId: 'e',
          },
          {
            type: 'standaloneStep',
            stepId: 'f',
          },
          {
            type: 'thermocyclerProfileGroup',
            startStepId: 'g',
            concurrentSteps: [
              { type: 'standaloneStep', stepId: 'd' },
              { type: 'standaloneStep', stepId: 'h' },
            ],
            waitStepId: 'i',
          },
          {
            type: 'standaloneStep',
            stepId: 'j',
          },
        ],
      },
    }
    expect(result).toStrictEqual(expectedResult)
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
          startStepId: 'b',
          concurrentSteps: [],
          waitStepId: 'c',
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
            startStepId: 'b',
            concurrentSteps: [{ type: 'standaloneStep', stepId: 'a' }],
            waitStepId: 'c',
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

  it('allows moving a standalone step to the end of a Vacuum profile concurrent group', () => {
    const originalHierarchy: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'pipette' },
        {
          type: 'vacuumProfileGroup',
          startStepId: 'vp',
          concurrentSteps: [],
          waitStepId: 'w',
        },
      ],
    }
    const result = computeStepMove(originalHierarchy, {
      moveType: 'insertAsLastStepOfGroup',
      movedStepId: 'pipette',
      destinationGroupRootStepId: 'vp',
    })
    const expectedResult: typeof result = {
      isMoveAllowed: true,
      stepsAfterMove: {
        topLevelItems: [
          {
            type: 'vacuumProfileGroup',
            startStepId: 'vp',
            concurrentSteps: [{ type: 'standaloneStep', stepId: 'pipette' }],
            waitStepId: 'w',
          },
        ],
      },
    }
    expect(result).toStrictEqual(expectedResult)
  })

  it('allows moving a standalone step to the end of a timed Vacuum state concurrent group', () => {
    const originalHierarchy: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'pipette' },
        {
          type: 'vacuumStateDurationGroup',
          startStepId: 'vs',
          concurrentSteps: [],
          waitStepId: 'w',
        },
      ],
    }
    const result = computeStepMove(originalHierarchy, {
      moveType: 'insertAsLastStepOfGroup',
      movedStepId: 'pipette',
      destinationGroupRootStepId: 'vs',
    })
    const expectedResult: typeof result = {
      isMoveAllowed: true,
      stepsAfterMove: {
        topLevelItems: [
          {
            type: 'vacuumStateDurationGroup',
            startStepId: 'vs',
            concurrentSteps: [{ type: 'standaloneStep', stepId: 'pipette' }],
            waitStepId: 'w',
          },
        ],
      },
    }
    expect(result).toStrictEqual(expectedResult)
  })

  it('can move an entire Thermocycler group', () => {
    const originalHierarchy: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: 'a',
        },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: 'b',
          concurrentSteps: [{ type: 'standaloneStep', stepId: 'c' }],
          waitStepId: 'd',
        },
        {
          type: 'standaloneStep',
          stepId: 'e',
        },
      ],
    }
    const result = computeStepMove(originalHierarchy, {
      moveType: 'insertBeforeDestinationStep',
      movedStepId: 'b',
      destinationStepId: 'a',
    })
    const expectedResult: typeof result = {
      isMoveAllowed: true,
      stepsAfterMove: {
        topLevelItems: [
          {
            type: 'thermocyclerProfileGroup',
            startStepId: 'b',
            concurrentSteps: [{ type: 'standaloneStep', stepId: 'c' }],
            waitStepId: 'd',
          },
          {
            type: 'standaloneStep',
            stepId: 'a',
          },
          {
            type: 'standaloneStep',
            stepId: 'e',
          },
        ],
      },
    }
    expect(result).toStrictEqual(expectedResult)
  })

  it('allows moving a step to itself, as a no-op', () => {
    const originalHierarchy: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: 'a',
        },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: 'b',
          concurrentSteps: [{ type: 'standaloneStep', stepId: 'c' }],
          waitStepId: 'd',
        },
        {
          type: 'standaloneStep',
          stepId: 'e',
        },
      ],
    }

    for (const stepId of ['a', 'b', 'c', /* skip d */ 'e']) {
      const result = computeStepMove(originalHierarchy, {
        moveType: 'insertBeforeDestinationStep',
        movedStepId: stepId,
        destinationStepId: stepId,
      })
      expect(result).toStrictEqual({
        isMoveAllowed: true,
        stepsAfterMove: originalHierarchy,
      } satisfies typeof result)
    }

    const result = computeStepMove(originalHierarchy, {
      moveType: 'insertAsLastStepOfGroup',
      movedStepId: 'c', // c is already the last step of its group.
      destinationGroupRootStepId: 'b',
    })
    expect(result).toStrictEqual({
      isMoveAllowed: true,
      stepsAfterMove: originalHierarchy,
    } satisfies typeof result)
  })
})

describe('computeStepSwap()', () => {
  it('should swap a top-level step up or down with its neighbor', () => {
    const step1: StandaloneStep = { type: 'standaloneStep', stepId: 'step_1' }
    const step2: StandaloneStep = { type: 'standaloneStep', stepId: 'step_2' }
    const step3TCProfile: ThermocyclerProfileGroup = {
      type: 'thermocyclerProfileGroup',
      startStepId: 'step_3_tc_profile',
      concurrentSteps: [
        { type: 'standaloneStep', stepId: 'step_3_tc_concurrent_1' },
        { type: 'standaloneStep', stepId: 'step_3_tc_concurrent_2' },
      ],
      waitStepId: 'step_3_tc_wait',
    }
    const step4: StandaloneStep = { type: 'standaloneStep', stepId: 'step_4' }
    const originalHierarchy: StepHierarchy = {
      topLevelItems: [step1, step2, step3TCProfile, step4],
    }

    // Swap step_2 up (should swap with step_1)
    expect(
      computeStepSwap(originalHierarchy, step2.stepId, 'up')
    ).toStrictEqual({
      topLevelItems: [step2, step1, step3TCProfile, step4],
    })

    // Swap step_2 down (should swap with step_3_tc_profile)
    expect(
      computeStepSwap(originalHierarchy, step2.stepId, 'down')
    ).toStrictEqual({
      topLevelItems: [step1, step3TCProfile, step2, step4],
    })

    // Swap step_3_tc_profile up (should swap with step_2)
    expect(
      computeStepSwap(originalHierarchy, step3TCProfile.startStepId, 'up')
    ).toStrictEqual({
      topLevelItems: [step1, step3TCProfile, step2, step4],
    })

    // Swap step_4 up (should swap with step_3_tc_profile)
    expect(
      computeStepSwap(originalHierarchy, step4.stepId, 'up')
    ).toStrictEqual({
      topLevelItems: [step1, step2, step4, step3TCProfile],
    })
  })

  it('should swap steps within a Thermocycler group concurrentSteps', () => {
    const originalHierarchy: StepHierarchy = {
      topLevelItems: [
        {
          type: 'thermocyclerProfileGroup',
          startStepId: 'profile_step',
          concurrentSteps: [
            { type: 'standaloneStep', stepId: 'concurrent_1' },
            { type: 'standaloneStep', stepId: 'concurrent_2' },
            { type: 'standaloneStep', stepId: 'concurrent_3' },
          ],
          waitStepId: 'wait_step',
        },
      ],
    }
    const result = computeStepSwap(originalHierarchy, 'concurrent_2', 'up')
    expect(result).toStrictEqual({
      topLevelItems: [
        {
          type: 'thermocyclerProfileGroup',
          startStepId: 'profile_step',
          concurrentSteps: [
            { type: 'standaloneStep', stepId: 'concurrent_2' },
            { type: 'standaloneStep', stepId: 'concurrent_1' },
            { type: 'standaloneStep', stepId: 'concurrent_3' },
          ],
          waitStepId: 'wait_step',
        },
      ],
    })
  })

  it('should not swap when step is at a boundary (first/last in top-level or Thermocycler group)', () => {
    const originalHierarchy: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'step_1' },
        { type: 'standaloneStep', stepId: 'step_2' },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: 'profile_step',
          concurrentSteps: [
            { type: 'standaloneStep', stepId: 'concurrent_1' },
            { type: 'standaloneStep', stepId: 'concurrent_2' },
          ],
          waitStepId: 'wait_step',
        },
        { type: 'standaloneStep', stepId: 'step_3' },
      ],
    }

    // First step of the top level of the hierarchy trying to move up.
    expect(computeStepSwap(originalHierarchy, 'step_1', 'up')).toStrictEqual(
      originalHierarchy
    )

    // Last step of the top level of the hierarchy trying to move down.
    expect(computeStepSwap(originalHierarchy, 'step_3', 'down')).toStrictEqual(
      originalHierarchy
    )

    // First step within a Thermocycler group trying to move up.
    // This ought to be allowed, but our current implementation doesn't support it.
    expect(
      computeStepSwap(originalHierarchy, 'concurrent_1', 'up')
    ).toStrictEqual(originalHierarchy)

    // Last step within a Thermocycler group trying to move down.
    // This ought to be allowed, but our current implementation doesn't support it.
    expect(
      computeStepSwap(originalHierarchy, 'concurrent_2', 'down')
    ).toStrictEqual(originalHierarchy)
  })

  it('should no-op if trying to move a nonexistent step', () => {
    const originalHierarchy: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: 'step_1',
        },
        {
          type: 'standaloneStep',
          stepId: 'step_2',
        },
      ],
    }
    const result = computeStepSwap(originalHierarchy, 'nonexistent', 'up')
    expect(result).toStrictEqual(originalHierarchy)
  })
})

describe('findStep()', () => {
  const stepHierarchy: StepHierarchy = {
    topLevelItems: [
      { type: 'standaloneStep', stepId: 'standalone_1' },
      { type: 'standaloneStep', stepId: 'standalone_2' },
      {
        type: 'thermocyclerProfileGroup',
        startStepId: 'tc_profile_root',
        concurrentSteps: [
          { type: 'standaloneStep', stepId: 'concurrent_1' },
          { type: 'standaloneStep', stepId: 'concurrent_2' },
          { type: 'standaloneStep', stepId: 'concurrent_3' },
        ],
        waitStepId: 'tc_wait',
      },
      { type: 'standaloneStep', stepId: 'standalone_3' },
    ],
  }

  it('should find a standalone step at the top level', () => {
    const result = findStep(stepHierarchy, 'standalone_3')
    expect(result).not.toBeNull()
    expect(result?.foundNode).toStrictEqual({
      type: 'standaloneStep',
      stepId: 'standalone_3',
    })
    expect(result?.enclosingNode).toBe(stepHierarchy)
    expect(result?.indexInEnclosingNode).toBe(3)
  })

  it('should find a thermocycler profile group root step', () => {
    const result = findStep(stepHierarchy, 'tc_profile_root')
    expect(result).not.toBeNull()
    expect(result?.foundNode).toBe(stepHierarchy.topLevelItems[2])
    expect(result?.enclosingNode).toBe(stepHierarchy)
    expect(result?.indexInEnclosingNode).toBe(2)
  })

  it('should find a concurrent step within a thermocycler profile group', () => {
    const result = findStep(stepHierarchy, 'concurrent_2')
    expect(result).not.toBeNull()
    expect(result?.foundNode).toStrictEqual({
      type: 'standaloneStep',
      stepId: 'concurrent_2',
    })
    expect(result?.enclosingNode).toBe(stepHierarchy.topLevelItems[2])
    expect(result?.indexInEnclosingNode).toBe(1)
  })

  it('should return null for the wait step of a thermocycler profile group', () => {
    expect(stepHierarchy.topLevelItems[2].type).toStrictEqual(
      'thermocyclerProfileGroup'
    )
    const thermocyclerProfileGroup = stepHierarchy
      .topLevelItems[2] as ThermocyclerProfileGroup

    const result = findStep(stepHierarchy, thermocyclerProfileGroup.waitStepId)
    expect(result).toBeNull()
  })

  it('should return null for a nonexistent step', () => {
    const result = findStep(stepHierarchy, 'nonexistent_step')
    expect(result).toBeNull()
  })
})

describe('getPairedSteps()', () => {
  const stepHierarchy: StepHierarchy = {
    topLevelItems: [
      { type: 'standaloneStep', stepId: '1' },
      {
        type: 'thermocyclerProfileGroup',
        startStepId: '2',
        concurrentSteps: [
          { type: 'standaloneStep', stepId: '3' },
          { type: 'standaloneStep', stepId: '4' },
        ],
        waitStepId: '5',
      },
      { type: 'standaloneStep', stepId: '6' },
    ],
  }

  test.each([
    {
      description:
        'should return the "wait" step paired with a "start profile" step',
      stepIds: ['2'],
      expected: ['5'],
    },
    {
      description:
        'should return the "start profile" step paired with a "wait" step',
      stepIds: ['5'],
      expected: ['2'],
    },
    {
      description:
        'should return both paired steps when both steps of a group are provided',
      stepIds: ['2', '5'],
      expected: ['2', '5'],
    },
    {
      description: 'should not pair anything with standalone steps',
      stepIds: ['1', '3', '4', '6'],
      expected: [],
    },
    {
      description: 'should return empty set for empty step IDs set',
      stepIds: [],
      expected: [],
    },
    {
      description:
        'should return empty set for steps that are not in any group',
      stepIds: ['999'],
      expected: [],
    },
  ])('$description', ({ stepIds, expected }) => {
    const result = getPairedSteps(stepHierarchy, new Set(stepIds))
    expect(result).toStrictEqual(new Set(expected))
  })
})
