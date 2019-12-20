// @flow
import { getNextDefaultTemperatureModuleId } from '../'

describe('getNextDefaultTemperatureModuleId', () => {
  describe('no previous forms', () => {
    const testCases = [
      {
        testMsg: 'temp and TC module present: use temp',
        equippedModulesById: {
          tempId: {
            id: 'tempId',
            type: 'tempdeck',
            model: 'GEN1',
            slot: '3',
            moduleState: { type: 'tempdeck' },
          },
          tcId: {
            id: 'tcId',
            type: 'thermocycler',
            model: 'GEN1',
            slot: '_span781011',
            moduleState: { type: 'tempdeck' },
          },
        },
        expected: 'tempId',
      },
      {
        testMsg: 'thermocycler only: use tc',
        equippedModulesById: {
          tcId: {
            id: 'tcId',
            type: 'thermocycler',
            model: 'GEN1',
            slot: '_span781011',
            moduleState: { type: 'tempdeck' },
          },
        },
        expected: 'tcId',
      },
    ]

    testCases.forEach(({ testMsg, equippedModulesById, expected }) => {
      test(testMsg, () => {
        const savedForms = {}
        const orderedStepIds = []

        const result = getNextDefaultTemperatureModuleId(
          savedForms,
          orderedStepIds,
          equippedModulesById
        )

        expect(result).toBe(expected)
      })
    })
  })
  // TODO (ka 2019-12-20): Add in tests for existing temperature form steps once wired up
})
