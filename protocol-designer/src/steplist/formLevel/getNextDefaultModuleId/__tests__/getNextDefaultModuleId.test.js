// @flow
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import { TEMPERATURE_DEACTIVATED } from '../../../../constants'
import { getNextDefaultTemperatureModuleId } from '..'

describe('getNextDefaultTemperatureModuleId', () => {
  describe('NO previous forms', () => {
    const testCases = [
      {
        testMsg: 'temp and TC module present: use temp',
        equippedModulesById: {
          tempId: {
            id: 'tempId',
            type: TEMPERATURE_MODULE_TYPE,
            model: TEMPERATURE_MODULE_V1,
            slot: '3',
            moduleState: {
              type: TEMPERATURE_MODULE_TYPE,
              status: TEMPERATURE_DEACTIVATED,
              targetTemperature: null,
            },
          },
          tcId: {
            id: 'tcId',
            type: THERMOCYCLER_MODULE_TYPE,
            model: THERMOCYCLER_MODULE_V1,
            slot: '_span781011',
            moduleState: { type: THERMOCYCLER_MODULE_TYPE },
          },
        },
        expected: 'tempId',
      },
      {
        testMsg: 'thermocycler only: use tc',
        equippedModulesById: {
          tcId: {
            id: 'tcId',
            type: THERMOCYCLER_MODULE_TYPE,
            model: THERMOCYCLER_MODULE_V1,
            slot: '_span781011',
            moduleState: {
              type: THERMOCYCLER_MODULE_TYPE,
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
            type: MAGNETIC_MODULE_TYPE,
            model: MAGNETIC_MODULE_V1,
            slot: '_span781011',
            moduleState: { type: MAGNETIC_MODULE_TYPE, engaged: false },
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
            type: TEMPERATURE_MODULE_TYPE,
            model: TEMPERATURE_MODULE_V1,
            slot: '3',
            moduleState: {
              type: TEMPERATURE_MODULE_TYPE,
              status: TEMPERATURE_DEACTIVATED,
              targetTemperature: null,
            },
          },
          tcId: {
            id: 'tcId',
            type: THERMOCYCLER_MODULE_TYPE,
            model: THERMOCYCLER_MODULE_V1,
            slot: '_span781011',
            moduleState: { type: THERMOCYCLER_MODULE_TYPE },
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
            stepType: THERMOCYCLER_MODULE_TYPE,
            stepName: THERMOCYCLER_MODULE_TYPE,
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
            type: MAGNETIC_MODULE_TYPE,
            model: MAGNETIC_MODULE_V1,
            slot: '_span781011',
            moduleState: { type: MAGNETIC_MODULE_TYPE, engaged: false },
          },
          tempId: {
            id: 'tempId',
            type: TEMPERATURE_MODULE_TYPE,
            model: TEMPERATURE_MODULE_V1,
            slot: '3',
            moduleState: {
              type: TEMPERATURE_MODULE_TYPE,
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
