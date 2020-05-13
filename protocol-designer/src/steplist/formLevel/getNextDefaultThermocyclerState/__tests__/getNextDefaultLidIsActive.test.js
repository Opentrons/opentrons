// @flow
import { getNextDefaultLidIsActive } from '../'

describe('getNextDefaultLidIsActive', () => {
  describe('no previous forms defaults to false', () => {
    const testCases = [
      {
        testMsg: 'returns false when no previous thermocycler state',
        expected: false,
      },
    ]

    testCases.forEach(({ testMsg, expected }) => {
      it(testMsg, () => {
        const savedForms = {}
        const orderedStepIds = []

        const result = getNextDefaultLidIsActive(savedForms, orderedStepIds)

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
        orderedStepIds: ['f', 't', 'f'],
        expected: false,
      },
    ]

    testCases.forEach(({ testMsg, orderedStepIds, expected }) => {
      it(testMsg, () => {
        const savedForms = {
          t: { id: 'moduleId', stepType: 'thermocycler', lidIsActive: true },
          f: { id: 'moduleId', stepType: 'thermocycler', lidIsActive: false },
        }

        const result = getNextDefaultLidIsActive(savedForms, orderedStepIds)

        expect(result).toBe(expected)
      })
    })
  })
})
