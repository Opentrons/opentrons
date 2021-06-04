import { getStateAndContextTempTCModules } from '../fixtures'
import { setTemperature } from '../commandCreators/atomic/setTemperature'
import type { InvariantContext, RobotState, SetTemperatureArgs } from '../types'

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'
const commandCreatorFnName = 'setTemperature'

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
    // TODO: Ian 2019-01-24 implement setTemperature for thermocycler
    // {
    //   testName: 'thermocycler',
    //   moduleId: thermocyclerId,
    //   expected: {
    //     commands: [
    //       {
    //         command: 'thermocycler/setTarget___TODO___Temperature',
    //         params: {
    //           module: thermocyclerId,
    //           temperature: targetTemperature,
    //         },
    //       },
    //     ],
    //   },
    // },
  ]

  testCases.forEach(({ expected, moduleId, testName }) => {
    it(testName, () => {
      const args: SetTemperatureArgs = {
        module: moduleId,
        targetTemperature,
        commandCreatorFnName,
      }
      const result = setTemperature(args, invariantContext, robotState)
      expect(result).toEqual(expected)
    })
  })
})
