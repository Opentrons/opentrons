import { beforeEach, describe, expect, it } from 'vitest'

import { deactivateTemperature } from '../commandCreators/atomic/deactivateTemperature'
import { getStateAndContextTempTCModules } from '../fixtures'

import type { ModuleOnlyParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../types'

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
})
