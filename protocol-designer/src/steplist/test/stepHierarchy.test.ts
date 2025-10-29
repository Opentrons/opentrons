import { describe, expect, it, test } from 'vitest'

import {
  PAUSE_UNTIL_TC_PROFILE_COMPLETE,
  THERMOCYCLER_PROFILE,
} from '/protocol-designer/constants'
import {
  computeStepMove,
  convertStepArrayToHierarchy,
  convertStepHierarchyToArray,
} from '/protocol-designer/steplist/utils/stepHierarchy'

import type { FormData } from '/protocol-designer/form-types'
import type { StepHierarchy } from '/protocol-designer/steplist/utils/stepHierarchy'

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

  it('should no-op if enableConcurrentModuleActions is false', () => {
    const input: FormData[] = [
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
    ]
    const result = convertStepArrayToHierarchy(input, false)
    const expectedResult: typeof result = {
      topLevelItems: input.map(step => ({
        type: 'standaloneStep',
        stepId: step.id,
      })),
    }
    expect(result).toStrictEqual(expectedResult)
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
          thermocyclerProfileStepId: 'b',
          concurrentSteps: [
            { type: 'standaloneStep', stepId: 'c' },
            { type: 'standaloneStep', stepId: 'd' },
          ],
          waitForThermocyclerProfileStepId: 'e',
        },
        {
          type: 'standaloneStep',
          stepId: 'f',
        },
        {
          type: 'thermocyclerProfileGroup',
          thermocyclerProfileStepId: 'g',
          concurrentSteps: [{ type: 'standaloneStep', stepId: 'h' }],
          waitForThermocyclerProfileStepId: 'i',
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
            thermocyclerProfileStepId: 'b',
            concurrentSteps: [{ type: 'standaloneStep', stepId: 'c' }],
            waitForThermocyclerProfileStepId: 'e',
          },
          {
            type: 'standaloneStep',
            stepId: 'f',
          },
          {
            type: 'thermocyclerProfileGroup',
            thermocyclerProfileStepId: 'g',
            concurrentSteps: [
              { type: 'standaloneStep', stepId: 'd' },
              { type: 'standaloneStep', stepId: 'h' },
            ],
            waitForThermocyclerProfileStepId: 'i',
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
    const originalHierarchy: StepHierarchy = {
      topLevelItems: [
        {
          type: 'standaloneStep',
          stepId: 'a',
        },
        {
          type: 'thermocyclerProfileGroup',
          thermocyclerProfileStepId: 'b',
          concurrentSteps: [{ type: 'standaloneStep', stepId: 'c' }],
          waitForThermocyclerProfileStepId: 'd',
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
            thermocyclerProfileStepId: 'b',
            concurrentSteps: [{ type: 'standaloneStep', stepId: 'c' }],
            waitForThermocyclerProfileStepId: 'd',
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
          thermocyclerProfileStepId: 'b',
          concurrentSteps: [{ type: 'standaloneStep', stepId: 'c' }],
          waitForThermocyclerProfileStepId: 'd',
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
