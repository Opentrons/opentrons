// @flow
import { getNextDefaultMagnetAction } from '../'

describe('getNextDefaultMagnetAction', () => {
  describe('no previous forms defaults to engage', () => {
    const testCases = [
      {
        testMsg: 'no previous magnet action',
        expected: 'engage',
      },
    ]

    testCases.forEach(({ testMsg, expected }) => {
      test(testMsg, () => {
        const savedForms = {}
        const orderedStepIds = []

        const result = getNextDefaultMagnetAction(savedForms, orderedStepIds)

        expect(result).toBe(expected)
      })
    })
  })

  describe('with previous forms', () => {
    const testCases = [
      {
        testMsg: 'returns disengage when engage previous selected',
        orderedStepIds: ['e', 'd', 'e'],
        expected: 'disengage',
      },
      {
        testMsg: 'returns engage when disengage previous selected',
        orderedStepIds: ['d', 'e', 'd'],
        expected: 'engage',
      },
    ]

    testCases.forEach(({ testMsg, orderedStepIds, expected }) => {
      test(testMsg, () => {
        const savedForms = {
          e: { id: 'moduleId', stepType: 'magnet', magnetAction: 'engage' },
          d: { id: 'moduleId', stepType: 'magnet', magnetAction: 'disengage' },
        }

        const result = getNextDefaultMagnetAction(savedForms, orderedStepIds)

        expect(result).toBe(expected)
      })
    })
  })
})
