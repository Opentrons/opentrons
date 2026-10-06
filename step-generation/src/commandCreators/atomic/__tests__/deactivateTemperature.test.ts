import { beforeEach, describe, expect, it } from 'vitest'

import {
  getErrorResult,
  getStateAndContextTempTCModules,
} from '../../../fixtures'
import { deactivateTemperature } from '../deactivateTemperature'

import type { ModuleOnlyParams } from '@opentrons/shared-data'
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
describe('deactivateTemperature', () => {
  const missingModuleError = {
    errors: [
      {
        message: expect.any(String),
        type: 'MISSING_MODULE',
      },
    ],
  }
  const testCases = [
    {
      testName: 'temperature module',
      moduleId: temperatureModuleId,
      expected: {
        commands: [
          {
            commandType: 'temperatureModule/deactivate',
            key: expect.any(String),
            params: {
              moduleId: temperatureModuleId,
            },
          },
        ],
        python: 'mock_temperature_module_1.deactivate()',
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
      const args: ModuleOnlyParams = {
        moduleId: moduleId ?? '',
      }
      const result = deactivateTemperature(args, invariantContext, robotState)
      expect(result).toEqual(expected)
    })
  })
  it('resolves moduleId when it is a string runtime parameter', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: temperatureModuleId,
      },
    }
    const result = deactivateTemperature(
      {
        moduleId: 'selected_module',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'temperatureModule/deactivate',
          key: expect.any(String),
          params: {
            moduleId: temperatureModuleId,
          },
        },
      ],
      python: 'mock_temperature_module_1.deactivate()',
    })
  })
  it('returns error if moduleId is not a string runtime parameter', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
    }
    const result = deactivateTemperature(
      {
        moduleId: 'mock_rtp',
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
