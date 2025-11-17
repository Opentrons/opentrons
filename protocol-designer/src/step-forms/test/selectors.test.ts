import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getBatchEditFormHasUnsavedChanges,
  getEquippedPipetteOptions,
  getNextUserVisibleStepNumber,
  getUnsavedFormIsPristineHeaterShakerForm,
  getUnsavedFormIsPristineSetTempForm,
  getUserVisibleStepNumbers,
} from '../selectors'

import type { StepHierarchy } from '/protocol-designer/steplist/utils/stepHierarchy'
import type { FormData } from '../../form-types'

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
    // @ts-expect-error(sa, 2021-6-14): resultFunc (from reselect) is weirdly not part of their Selector interface
    const result = getEquippedPipetteOptions.resultFunc(initialDeckState)
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
    // @ts-expect-error(sa, 2021-6-14): resultFunc (from reselect) is weirdly not part of their Selector interface
    const result = getEquippedPipetteOptions.resultFunc(initialDeckState)
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
    // @ts-expect-error(sa, 2021-6-14): resultFunc (from reselect) is weirdly not part of their Selector interface
    const result = getEquippedPipetteOptions.resultFunc(initialDeckState)
    expect(result).toEqual(expected)
  })
})
describe('getBatchEditFormHasUnsavedChanges', () => {
  it('should return true if there are unsaved changes ', () => {
    expect(
      // @ts-expect-error(sa, 2021-6-14): resultFunc (from reselect) is weirdly not part of their Selector interface
      getBatchEditFormHasUnsavedChanges.resultFunc({
        someField: 'someVal',
      })
    ).toBe(true)
  })
  it('should return false if there are no unsaved changes ', () => {
    // @ts-expect-error(sa, 2021-6-14): resultFunc (from reselect) is weirdly not part of their Selector interface
    expect(getBatchEditFormHasUnsavedChanges.resultFunc({})).toBe(false)
  })
})

describe('getUnsavedFormIsPristineSetTempForm', () => {
  const mockIsPresaved = true
  it('should return true if temperature mod set temp is true formData ', () => {
    // @ts-expect-error(jr, 4/8/22): missing module id
    const formData: FormData = {
      stepType: 'temperature',
      targetTemperature: 33,
    }
    const expected = true
    // @ts-expect-error(jr, 4/8/22): resultFunc (from reselect) is not part of their Selector interface
    const result = getUnsavedFormIsPristineSetTempForm.resultFunc(
      formData,
      mockIsPresaved
    )
    expect(result).toEqual(expected)
  })
  it('should return false if temperature mod is false in formData ', () => {
    // @ts-expect-error(jr, 4/8/22): missing module id
    const formData: FormData = {
      stepType: 'temperature',
      setTemperature: null,
    }
    const expected = false
    // @ts-expect-error(jr, 4/8/22): resultFunc (from reselect) is not part of their Selector interface
    const result = getUnsavedFormIsPristineSetTempForm.resultFunc(
      formData,
      mockIsPresaved
    )
    expect(result).toEqual(expected)
  })
})

describe('getUnsavedFormIsPrestineSetHeaterShakerTempForm', () => {
  const mockIsPresaved = true
  it('should return true if heater shaker temperature is true in formData ', () => {
    // @ts-expect-error(jr, 4/8/22): missing module id
    const formData: FormData = {
      stepType: 'heaterShaker',
      targetHeaterShakerTemperature: '10',
    }
    const expected = true
    // @ts-expect-error(jr, 4/8/22): resultFunc (from reselect) is not part of their Selector interface
    const result = getUnsavedFormIsPristineHeaterShakerForm.resultFunc(
      formData,
      mockIsPresaved
    )
    expect(result).toEqual(expected)
  })
  it('should return false if heater shaker temperature is false in formData ', () => {
    // @ts-expect-error(jr, 4/8/22): missing module id
    const formData: FormData = {
      stepType: 'heaterShaker',
      targetHeaterShakerTemperature: null,
    }
    const expected = false
    // @ts-expect-error(jr, 4/8/22): resultFunc (from reselect) is not part of their Selector interface
    const result = getUnsavedFormIsPristineHeaterShakerForm.resultFunc(
      formData,
      mockIsPresaved
    )
    expect(result).toEqual(expected)
  })
})

describe('getUserVisibleStepNumbers() and getNextUserVisibleStepNumber()', () => {
  it("should count steps, excluding hidden 'wait for Thermocycler profile' steps", () => {
    const input: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'a' },
        {
          type: 'thermocyclerProfileGroup',
          thermocyclerProfileStepId: 'b',
          concurrentSteps: [{ type: 'standaloneStep', stepId: 'c' }],
          waitForThermocyclerProfileStepId: 'd',
        },
        { type: 'standaloneStep', stepId: 'e' },
      ],
    }

    // @ts-expect-error(mm, 2025-11-14): resultFunc (from reselect) is not part of their Selector interface
    const stepNumbersResult = getUserVisibleStepNumbers.resultFunc(input)
    const nextStepNumberResult =
      // @ts-expect-error(mm, 2025-11-14): resultFunc (from reselect) is not part of their Selector interface
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

    // @ts-expect-error(mm, 2025-11-14): resultFunc (from reselect) is not part of their Selector interface
    const stepNumbersResult = getUserVisibleStepNumbers.resultFunc(input)
    const nextStepNumberResult =
      // @ts-expect-error(mm, 2025-11-14): resultFunc (from reselect) is not part of their Selector interface
      getNextUserVisibleStepNumber.resultFunc(stepNumbersResult)

    expect(stepNumbersResult).toStrictEqual({})
    expect(nextStepNumberResult).toStrictEqual(1)
  })
})
