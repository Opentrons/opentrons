// @flow
import { getStateAndContextTempMagModules } from './fixtures'
import { setTemperature } from '../commandCreators/atomic/setTemperature'

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocycylerId'
const commandCreatorFnName = 'setTemperature'

let invariantContext
let robotState

beforeEach(() => {
  const stateAndContext = getStateAndContextTempMagModules({
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
            command: 'temperatureModule/setTargetTemperature',
            params: {
              module: temperatureModuleId,
              temperature: targetTemperature,
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
    {
      testName: 'thermocycler',
      moduleId: thermocyclerId,
      expected: {
        commands: [
          {
            command: 'thermocycler/setTargetTemperature',
            params: {
              module: thermocyclerId,
              temperature: targetTemperature,
            },
          },
        ],
      },
    },
  ]

  testCases.forEach(({ expected, moduleId, testName }) => {
    test(testName, () => {
      const args = { module: moduleId, targetTemperature, commandCreatorFnName }
      const result = setTemperature(args, invariantContext, robotState)
      expect(result).toEqual(expected)
    })
  })
})
