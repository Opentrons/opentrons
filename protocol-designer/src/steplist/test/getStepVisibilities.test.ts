import { describe, expect, it } from 'vitest'

import { getStepVisibilities } from '../utils/getStepVisibilities'

import type { StepHierarchy } from '../utils/stepHierarchy'

describe('getStepVisibilities()', () => {
  it('should mark Vacuum profile wait steps as invisible', () => {
    const input: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'a' },
        {
          type: 'vacuumProfileGroup',
          startStepId: 'b',
          concurrentSteps: [{ type: 'standaloneStep', stepId: 'c' }],
          waitStepId: 'd',
        },
        { type: 'standaloneStep', stepId: 'e' },
      ],
    }

    const result = getStepVisibilities(input)

    expect(result).toStrictEqual({
      a: { isVisibleToUser: true },
      b: { isVisibleToUser: true },
      c: { isVisibleToUser: true },
      d: { isVisibleToUser: false },
      e: { isVisibleToUser: true },
    })
  })

  it('should mark timed Vacuum state wait steps as invisible', () => {
    const input: StepHierarchy = {
      topLevelItems: [
        { type: 'standaloneStep', stepId: 'a' },
        {
          type: 'vacuumStateDurationGroup',
          startStepId: 'b',
          concurrentSteps: [{ type: 'standaloneStep', stepId: 'c' }],
          waitStepId: 'd',
        },
        { type: 'standaloneStep', stepId: 'e' },
      ],
    }

    const result = getStepVisibilities(input)

    expect(result).toStrictEqual({
      a: { isVisibleToUser: true },
      b: { isVisibleToUser: true },
      c: { isVisibleToUser: true },
      d: { isVisibleToUser: false },
      e: { isVisibleToUser: true },
    })
  })

  it('should mark Thermocycler profile wait steps as invisible', () => {
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

    const result = getStepVisibilities(input)

    expect(result).toStrictEqual({
      a: { isVisibleToUser: true },
      b: { isVisibleToUser: true },
      c: { isVisibleToUser: true },
      d: { isVisibleToUser: false },
      e: { isVisibleToUser: true },
    })
  })

  it('should tolerate empty input', () => {
    const input: StepHierarchy = {
      topLevelItems: [],
    }

    const result = getStepVisibilities(input)

    expect(result).toStrictEqual({})
  })
})
