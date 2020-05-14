// @flow
import { getNextDefaultLidOpen } from '../'

describe('getNextDefaultLidOpen', () => {
  describe('no previous forms defaults to null', () => {
    const testCases = [
      {
        testMsg: 'returns null when no previous thermocycler state',
        expected: null,
      },
    ]

    testCases.forEach(({ testMsg, expected }) => {
      it(testMsg, () => {
        const savedForms = {}
        const orderedStepIds = []

        const result = getNextDefaultLidOpen(savedForms, orderedStepIds)

        expect(result).toBe(expected)
      })
    })
  })

  describe('with previous forms', () => {
    const testCases = [
      {
        testMsg: 'returns true when true previously selected',
        orderedStepIds: ['t', 'f', 't'],
        expected: true,
      },
      {
        testMsg: 'returns false when false previously selected',
        orderedStepIds: ['f', 'f', 'f'],
        expected: false,
      },
    ]

    testCases.forEach(({ testMsg, orderedStepIds, expected }) => {
      it(testMsg, () => {
        const savedForms = {
          t: { id: 'moduleId', stepType: 'thermocycler', lidOpen: true },
          f: { id: 'moduleId', stepType: 'thermocycler', lidOpen: false },
        }

        const result = getNextDefaultLidOpen(savedForms, orderedStepIds)

        expect(result).toBe(expected)
      })
    })
  })
})
