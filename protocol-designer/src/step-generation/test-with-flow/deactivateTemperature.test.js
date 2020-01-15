// @flow
import { getStateAndContextTempMagModules } from './fixtures'
import { deactivateTemperature } from '../commandCreators/atomic/deactivateTemperature'

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'
const commandCreatorFnName = 'deactivateTemperature'

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

describe('deactivateTemperature', () => {
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
            command: 'temperatureModule/deactivate',
            params: {
              module: temperatureModuleId,
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
            command: 'thermocycler/deactivate',
            params: {
              module: thermocyclerId,
            },
          },
        ],
      },
    },
  ]

  testCases.forEach(({ expected, moduleId, testName }) => {
    test(testName, () => {
      const args = { module: moduleId, commandCreatorFnName }
      const result = deactivateTemperature(args, invariantContext, robotState)
      expect(result).toEqual(expected)
    })
  })
})
