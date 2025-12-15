import { describe, expect, it } from 'vitest'

import { getThermocyclerProfileRepetitionsForPython } from '../getThermocyclerProfileRepetitionsForPython'

describe('getThermocyclerProfileRepetitionsForPython', () => {
  it('has 123 repetitions', () => {
    expect(
      getThermocyclerProfileRepetitionsForPython([
        {
          repetitions: 123,
          steps: [
            { holdSeconds: 50, celsius: 50 },
            { holdSeconds: 60, celsius: 60 },
          ],
        },
      ])
    ).toEqual({
      repeatingProfileSteps: [
        { holdSeconds: 50, celsius: 50 },
        { holdSeconds: 60, celsius: 60 },
      ],
      numRepetitions: 123,
    })
  })

  it('has 1 repetition, flattened', () => {
    expect(
      getThermocyclerProfileRepetitionsForPython([
        {
          repetitions: 2,
          steps: [
            { holdSeconds: 50, celsius: 50 },
            { holdSeconds: 60, celsius: 60 },
          ],
        },
        {
          repetitions: 2,
          steps: [{ holdSeconds: 70, celsius: 70 }],
        },
      ])
    ).toEqual({
      repeatingProfileSteps: [
        { holdSeconds: 50, celsius: 50 },
        { holdSeconds: 60, celsius: 60 },
        { holdSeconds: 50, celsius: 50 },
        { holdSeconds: 60, celsius: 60 },
        { holdSeconds: 70, celsius: 70 },
        { holdSeconds: 70, celsius: 70 },
      ],
      numRepetitions: 1,
    })
  })

  it('handles empty input', () => {
    expect(getThermocyclerProfileRepetitionsForPython([])).toEqual({
      repeatingProfileSteps: [],
      numRepetitions: 1,
    })
  })
})
