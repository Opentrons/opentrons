import { getStateAndContextTempTCModules } from '../fixtures'
import { deactivateTemperature } from '../commandCreators/atomic/deactivateTemperature'
import {
  InvariantContext,
  RobotState,
  DeactivateTemperatureArgs,
} from '../types'
const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'
const commandCreatorFnName = 'deactivateTemperature'
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
      const args: DeactivateTemperatureArgs = {
        module: moduleId,
        commandCreatorFnName,
      }
      const result = deactivateTemperature(args, invariantContext, robotState)
      expect(result).toEqual(expected)
    })
  })
})
