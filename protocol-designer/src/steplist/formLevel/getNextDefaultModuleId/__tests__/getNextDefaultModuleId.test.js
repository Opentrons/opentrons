// @flow
import {
  TEMPERATURE_DEACTIVATED,
  MAGDECK,
  THERMOCYCLER,
  TEMPDECK,
} from '../../../../constants'
import { getNextDefaultTemperatureModuleId } from '..'

describe('getNextDefaultTemperatureModuleId', () => {
  describe('NO previous forms', () => {
    const testCases = [
      {
        testMsg: 'temp and TC module present: use temp',
        equippedModulesById: {
          tempId: {
            id: 'tempId',
            type: 'tempdeck',
            model: 'GEN1',
            slot: '3',
            moduleState: {
              type: TEMPDECK,
              status: TEMPERATURE_DEACTIVATED,
              targetTemperature: null,
            },
          },
          tcId: {
            id: 'tcId',
            type: THERMOCYCLER,
            model: 'GEN1',
            slot: '_span781011',
            moduleState: { type: THERMOCYCLER },
          },
        },
        expected: 'tempId',
      },
      {
        testMsg: 'thermocycler only: use tc',
        equippedModulesById: {
          tcId: {
            id: 'tcId',
            type: THERMOCYCLER,
            model: 'GEN1',
            slot: '_span781011',
            moduleState: {
              type: THERMOCYCLER,
            },
          },
        },
        expected: 'tcId',
      },
      {
        testMsg: 'only mag module present: return null',
        equippedModulesById: {
          magId: {
            id: 'magId',
            type: MAGDECK,
            model: 'GEN1',
            slot: '_span781011',
            moduleState: { type: MAGDECK, engaged: false },
          },
        },
        expected: null,
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
  describe('previous forms', () => {
    const testCases = [
      {
        testMsg: 'temp and tc present, last step was tc: use temp mod',
        equippedModulesById: {
          tempId: {
            id: 'tempId',
            type: 'tempdeck',
            model: 'GEN1',
            slot: '3',
            moduleState: {
              type: TEMPDECK,
              status: TEMPERATURE_DEACTIVATED,
              targetTemperature: null,
            },
          },
          tcId: {
            id: 'tcId',
            type: THERMOCYCLER,
            model: 'GEN1',
            slot: '_span781011',
            moduleState: { type: THERMOCYCLER },
          },
        },
        savedForms: {
          tempStepId: {
            id: 'tempStepId',
            stepType: 'temperature',
            stepName: 'temperature',
            moduleId: 'tempId',
          },
          tcStepId: {
            id: 'tcStepId',
            stepType: THERMOCYCLER,
            stepName: THERMOCYCLER,
            moduleId: 'tcId',
          },
        },
        orderedStepIds: ['tempStepId', 'tcStepId'],
        expected: 'tempId',
      },
      {
        testMsg: 'temp and mag present, last step was mag step: use temp mod',
        equippedModulesById: {
          magId: {
            id: 'magId',
            type: MAGDECK,
            model: 'GEN1',
            slot: '_span781011',
            moduleState: { type: MAGDECK, engaged: false },
          },
          tempId: {
            id: 'tempId',
            type: 'tempdeck',
            model: 'GEN1',
            slot: '3',
            moduleState: {
              type: TEMPDECK,
              status: TEMPERATURE_DEACTIVATED,
              targetTemperature: null,
            },
          },
        },
        savedForms: {
          tempStepId: {
            id: 'tempStepId',
            stepType: 'temperature',
            stepName: 'temperature',
            moduleId: 'tempId',
          },
          magStepId: {
            id: 'magStepId',
            stepType: 'magnet',
            stepName: 'magnet',
            moduleId: 'magdeckId',
          },
        },
        orderedStepIds: ['tempStepId', 'magStepId'],
        expected: 'tempId',
      },
    ]

    testCases.forEach(
      ({
        testMsg,
        savedForms = {},
        equippedModulesById,
        orderedStepIds = [],
        expected,
      }) => {
        test(testMsg, () => {
          const result = getNextDefaultTemperatureModuleId(
            savedForms,
            orderedStepIds,
            equippedModulesById
          )

          expect(result).toBe(expected)
        })
      }
    )
  })
})
