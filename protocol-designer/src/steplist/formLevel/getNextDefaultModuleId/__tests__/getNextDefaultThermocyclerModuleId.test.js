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
import { getNextDefaultThermocyclerModuleId } from '../getNextDefaultThermocyclerModuleId'

describe('getNextDefaultThermocyclerModuleId', () => {
  describe('NO previous forms', () => {
    const testCases = [
      {
        testMsg: 'temp and TC module present: use TC',
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
        expected: 'tcId',
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
      it(testMsg, () => {
        const savedForms = {}
        const orderedStepIds = []

        const result = getNextDefaultThermocyclerModuleId(
          savedForms,
          orderedStepIds,
          equippedModulesById
        )

        expect(result).toBe(expected)
      })
    })
  })

  describe('previous forms', () => {
    const testCases = [
      {
        testMsg: 'temp and tc present, last step was tc: use tc mod',
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
        expected: 'tcId',
      },
      {
        testMsg: 'temp and mag present, last step was mag step: return null',
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
        expected: null,
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
        it(testMsg, () => {
          const result = getNextDefaultThermocyclerModuleId(
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
