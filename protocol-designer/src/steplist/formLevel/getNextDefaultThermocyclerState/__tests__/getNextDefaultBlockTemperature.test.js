// @flow
import { getNextDefaultBlockTemperature } from '../'

describe('getNextDefaultBlockTemperature', () => {
  describe('no previous forms defaults to null', () => {
    const testCases = [
      {
        testMsg: 'returns false when no previous thermocycler state',
        expected: null,
      },
    ]

    testCases.forEach(({ testMsg, expected }) => {
      it(testMsg, () => {
        const savedForms = {}
        const orderedStepIds = []

        const result = getNextDefaultBlockTemperature(
          savedForms,
          orderedStepIds
        )

        expect(result).toBe(expected)
      })
    })
  })

  describe('with previous forms', () => {
    const testCases = [
      {
        testMsg:
          'returns null when block deactivated and no previous block temp entered',
        orderedStepIds: ['d'],
        expected: null,
      },
      {
        testMsg: 'block target temp populates with previously saved value',
        orderedStepIds: ['d', 'a'],
        expected: 40,
      },
    ]

    testCases.forEach(({ testMsg, orderedStepIds, expected }) => {
      it(testMsg, () => {
        const savedForms = {
          a: {
            id: 'moduleId',
            stepType: 'thermocycler',
            blockIsActive: true,
            blockTargetTemp: 40,
          },
          d: { id: 'moduleId', stepType: 'thermocycler', blockIsActive: false },
        }

        const result = getNextDefaultBlockTemperature(
          savedForms,
          orderedStepIds
        )

        expect(result).toBe(expected)
      })
    })
  })
})
