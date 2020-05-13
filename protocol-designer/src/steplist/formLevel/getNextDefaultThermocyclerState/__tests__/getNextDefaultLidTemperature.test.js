// @flow
import { getNextDefaultLidTemperature } from '../'

describe('getNextDefaultLidTemperature', () => {
  describe('no previous forms defaults to null', () => {
    const testCases = [
      {
        testMsg: 'no previous thermocycler state',
        expected: null,
      },
    ]

    testCases.forEach(({ testMsg, expected }) => {
      it(testMsg, () => {
        const savedForms = {}
        const orderedStepIds = []

        const result = getNextDefaultLidTemperature(savedForms, orderedStepIds)

        expect(result).toBe(expected)
      })
    })
  })

  describe('with previous forms', () => {
    const testCases = [
      {
        testMsg:
          'returns null when lid deactivated and no previous lid temp entered',
        orderedStepIds: ['d'],
        expected: null,
      },
      {
        testMsg:
          'returns default when lid activated previous selected and previous lid temp entered',
        orderedStepIds: ['a', 'd', 'a'],
        expected: 40,
      },
      {
        testMsg:
          'returns default when lid deactivated previous selected and previous lid temp entered',
        orderedStepIds: ['d', 'a', 'd'],
        expected: 40,
      },
    ]

    testCases.forEach(({ testMsg, orderedStepIds, expected }) => {
      it(testMsg, () => {
        const savedForms = {
          a: {
            id: 'moduleId',
            stepType: 'thermocycler',
            lidIsActive: true,
            lidTargetTemp: 40,
          },
          d: { id: 'moduleId', stepType: 'thermocycler', lidIsActive: false },
        }

        const result = getNextDefaultLidTemperature(savedForms, orderedStepIds)

        expect(result).toBe(expected)
      })
    })
  })
})
