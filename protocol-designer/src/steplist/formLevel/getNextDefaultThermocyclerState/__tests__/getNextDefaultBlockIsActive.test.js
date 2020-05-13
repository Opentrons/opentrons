// @flow
import { getNextDefaultBlockIsActive } from '../'

describe('getNextDefaultBlockIsActive', () => {
  describe('no previous forms defaults to false', () => {
    const testCases = [
      {
        testMsg: 'no previous thermocycler state',
        expected: false,
      },
    ]

    testCases.forEach(({ testMsg, expected }) => {
      it(testMsg, () => {
        const savedForms = {}
        const orderedStepIds = []

        const result = getNextDefaultBlockIsActive(savedForms, orderedStepIds)

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
          t: { id: 'moduleId', stepType: 'thermocycler', blockIsActive: true },
          f: { id: 'moduleId', stepType: 'thermocycler', blockIsActive: false },
        }

        const result = getNextDefaultBlockIsActive(savedForms, orderedStepIds)

        expect(result).toBe(expected)
      })
    })
  })
})
