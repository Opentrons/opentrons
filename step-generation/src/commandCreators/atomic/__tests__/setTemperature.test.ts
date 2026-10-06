import { beforeEach, describe, expect, it } from 'vitest'

import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'

import {
  getErrorResult,
  getStateAndContextTempTCModules,
} from '../../../fixtures'
import { setTemperature } from '../setTemperature'

import type { TemperatureParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'

let invariantContext: InvariantContext
let robotState: RobotState

beforeEach(() => {
  const stateAndContext = getStateAndContextTempTCModules({
    temperatureModuleId,
    thermocyclerId,
  })
  invariantContext = stateAndContext.invariantContext
  robotState = stateAndContext.robotState
})

describe('setTemperature', () => {
  const targetTemperature = 42
  const missingModuleError = {
    errors: [{ message: expect.any(String), type: 'MISSING_MODULE' }],
  }

  const testCases = [
    {
      testName: 'temperature module',
      moduleId: temperatureModuleId,
      expected: {
        commands: [
          {
            commandType: 'temperatureModule/setTargetTemperature',
            key: expect.any(String),
            params: {
              moduleId: temperatureModuleId,
              celsius: targetTemperature,
            },
          },
        ],
        python: `mock_temperature_module_1.start_set_temperature(${targetTemperature})`,
      },
    },
    {
      testName: 'no such moduleId',
      moduleId: 'someNonexistentModuleId',
      expected: missingModuleError,
    },
    {
      testName: 'null moduleId',
      moduleId: null,
      expected: missingModuleError,
    },
  ]

  testCases.forEach(({ expected, moduleId, testName }) => {
    it(testName, () => {
      const args: TemperatureParams = {
        moduleId: moduleId ?? '',
        celsius: targetTemperature,
      }
      const result = setTemperature(args, invariantContext, robotState)
      expect(result).toEqual(expected)
    })
  })
  it('renders the correct comands and python for a heater-shaker setTemperature', () => {
    const heaterShakerId = 'heaterShakerId'
    invariantContext = {
      ...invariantContext,
      moduleEntities: {
        heaterShakerId: {
          id: heaterShakerId,
          type: HEATERSHAKER_MODULE_TYPE,
          model: 'heaterShakerModuleV1',
          pythonName: 'mock_heater_shaker_module_1',
        },
      },
    }
    const args: TemperatureParams = {
      moduleId: heaterShakerId,
      celsius: targetTemperature,
    }

    expect(setTemperature(args, invariantContext, robotState)).toEqual({
      commands: [
        {
          commandType: 'heaterShaker/setTargetTemperature',
          key: expect.any(String),
          params: {
            moduleId: heaterShakerId,
            celsius: targetTemperature,
          },
        },
      ],
      python: `mock_heater_shaker_module_1.set_target_temperature(${targetTemperature})`,
    })
  })
  it('resolves moduleId and celsius when they are runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: temperatureModuleId,
      },
      target_temp: {
        variableName: 'target_temp',
        displayName: 'Target temp',
        type: 'int',
        default: 42,
      },
    }
    const result = setTemperature(
      {
        moduleId: 'selected_module',
        celsius: 'target_temp',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'temperatureModule/setTargetTemperature',
          key: expect.any(String),
          params: {
            moduleId: temperatureModuleId,
            celsius: 42,
          },
        },
      ],
      python: 'mock_temperature_module_1.start_set_temperature(target_temp)',
    })
  })
  it('returns errors if moduleId and celsius are not valid runtime parameters', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
      mock_string_rtp: {
        variableName: 'mock_string_rtp',
        displayName: 'mock string rtp',
        type: 'string',
        default: 'mock',
      },
    }
    const result = setTemperature(
      {
        moduleId: 'mock_rtp',
        celsius: 'mock_string_rtp',
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
