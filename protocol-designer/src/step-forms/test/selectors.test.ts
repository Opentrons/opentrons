import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getBatchEditFormHasUnsavedChanges,
  getEquippedPipetteOptions,
  getNextUserVisibleStepNumber,
  getUserVisibleStepNumbers,
} from '../selectors'

import type { StepHierarchy } from '/protocol-designer/steplist/utils/stepHierarchy'

vi.mock('../../steplist/fieldLevel')
vi.mock('../utils/getProfileItemsHaveErrors')

beforeEach(() => {
  vi.clearAllMocks()
})
describe('getEquippedPipetteOptions', () => {
  it('appends mount to pipette dropdown when pipettes are same model', () => {
    const initialDeckState = {
      pipettes: {
        123: {
          name: 'p20_single_gen2',
          mount: 'left',
        },
        456: {
          name: 'p20_single_gen2',
          mount: 'right',
        },
      },
    }
    const expected = [
      {
        name: 'P20 Single-Channel GEN2 (L)',
        value: '123',
      },
      {
        name: 'P20 Single-Channel GEN2 (R)',
        value: '456',
      },
    ]
    const result = getEquippedPipetteOptions.resultFunc(initialDeckState as any)
    expect(result).toEqual(expected)
  })
  it('does NOT append mount to pipette dropdown when pipettes are different models', () => {
    const initialDeckState = {
      pipettes: {
        123: {
          name: 'p300_single_gen2',
          mount: 'left',
        },
        456: {
          name: 'p20_single_gen2',
          mount: 'right',
        },
      },
    }
    const expected = [
      {
        name: 'P300 Single-Channel GEN2',
        value: '123',
      },
      {
        name: 'P20 Single-Channel GEN2',
        value: '456',
      },
    ]
    const result = getEquippedPipetteOptions.resultFunc(initialDeckState as any)
    expect(result).toEqual(expected)
  })
  it('does NOT append mount to pipette dropdown when only one pipette', () => {
    const initialDeckState = {
      pipettes: {
        123: {
          name: 'p300_single_gen2',
          mount: 'left',
        },
      },
    }
    const expected = [
      {
        name: 'P300 Single-Channel GEN2',
        value: '123',
      },
    ]
    const result = getEquippedPipetteOptions.resultFunc(initialDeckState as any)
    expect(result).toEqual(expected)
  })
})
describe('getBatchEditFormHasUnsavedChanges', () => {
  it('should return true if there are unsaved changes ', () => {
    expect(
      getBatchEditFormHasUnsavedChanges.resultFunc({
        someField: 'someVal',
      })
    ).toBe(true)
  })
  it('should return false if there are no unsaved changes ', () => {
    expect(getBatchEditFormHasUnsavedChanges.resultFunc({})).toBe(false)
  })
})

describe('getUserVisibleStepNumbers() and getNextUserVisibleStepNumber()', () => {
  it("should count steps, excluding hidden 'wait for Thermocycler profile' steps", () => {
    const input: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'a' },
        {
          type: 'thermocyclerProfileGroup',
          startStepId: 'b',
          concurrentSteps: [{ type: 'standaloneStep', stepId: 'c' }],
          waitStepId: 'd',
        },
        { type: 'standaloneStep', stepId: 'e' },
      ],
    }

    const stepNumbersResult = getUserVisibleStepNumbers.resultFunc(input)
    const nextStepNumberResult =
      getNextUserVisibleStepNumber.resultFunc(stepNumbersResult)

    expect(stepNumbersResult).toStrictEqual({
      a: 1,
      b: 2,
      c: 3,
      d: null,
      e: 4,
    })
    expect(nextStepNumberResult).toStrictEqual(5)
  })

  it('should tolerate empty input', () => {
    const input: StepHierarchy = {
      topLevelItems: [],
    }

    const stepNumbersResult = getUserVisibleStepNumbers.resultFunc(input)
    const nextStepNumberResult =
      getNextUserVisibleStepNumber.resultFunc(stepNumbersResult)

    expect(stepNumbersResult).toStrictEqual({})
    expect(nextStepNumberResult).toStrictEqual(1)
  })
})
