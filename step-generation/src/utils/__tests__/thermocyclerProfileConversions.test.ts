import { describe, expect, it } from 'vitest'

import {
  getThermocyclerProfileRepetitionsForPython,
  unrollThermocyclerProfile,
} from '../thermocyclerProfileConversions'

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

describe('unrollThermocyclerProfile', () => {
  it('unrolls cycles and atomic steps into a list of atomic steps', () => {
    expect(
      unrollThermocyclerProfile([
        { holdSeconds: 10, celsius: 100 },
        {
          repetitions: 2,
          steps: [
            { holdSeconds: 20, celsius: 200 },
            { holdSeconds: 30, celsius: 300 },
          ],
        },
        { holdSeconds: 40, celsius: 400 },
      ])
    ).toStrictEqual([
      { holdSeconds: 10, celsius: 100 },
      { holdSeconds: 20, celsius: 200 },
      { holdSeconds: 30, celsius: 300 },
      { holdSeconds: 20, celsius: 200 },
      { holdSeconds: 30, celsius: 300 },
      { holdSeconds: 40, celsius: 400 },
    ])
  })

  it('skips 0-repetition cycles', () => {
    expect(
      unrollThermocyclerProfile([
        { holdSeconds: 10, celsius: 100 },
        {
          repetitions: 0,
          steps: [
            { holdSeconds: 20, celsius: 200 },
            { holdSeconds: 30, celsius: 300 },
          ],
        },
        { holdSeconds: 40, celsius: 400 },
      ])
    ).toStrictEqual([
      { holdSeconds: 10, celsius: 100 },
      { holdSeconds: 40, celsius: 400 },
    ])
  })

  it('handles empty input', () => {
    expect(unrollThermocyclerProfile([])).toStrictEqual([])
  })
})
