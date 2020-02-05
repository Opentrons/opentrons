// @flow
import cloneDeep from 'lodash/cloneDeep'
import { getStateAndContextTempMagModules } from './fixtures'
import { awaitTemperature } from '../commandCreators/atomic/awaitTemperature'
import {
  TEMPERATURE_AT_TARGET,
  TEMPDECK,
  TEMPERATURE_APPROACHING_TARGET,
} from '../../constants'

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'
const commandCreatorFnName = 'awaitTemperature'

let invariantContext
let robotState
let robotAtTargetTemp
let robotApproachingTemp

beforeEach(() => {
  const stateAndContext = getStateAndContextTempMagModules({
    temperatureModuleId,
    thermocyclerId,
  })
  invariantContext = stateAndContext.invariantContext
  robotState = stateAndContext.robotState

  robotAtTargetTemp = cloneDeep(robotState)
  robotAtTargetTemp.modules[temperatureModuleId].moduleState = {
    type: TEMPDECK,
    targetTemperature: 42,
    status: TEMPERATURE_AT_TARGET,
  }

  robotApproachingTemp = cloneDeep(robotState)
  robotApproachingTemp.modules[temperatureModuleId].moduleState = {
    type: TEMPDECK,
    targetTemperature: 42,
    status: TEMPERATURE_APPROACHING_TARGET,
  }
})

describe('awaitTemperature', () => {
  const missingModuleError = {
    errors: [{ message: expect.any(String), type: 'MISSING_MODULE' }],
  }
  const missingTempStep = {
    errors: [{ message: expect.any(String), type: 'MISSING_TEMP_STEP' }],
  }

  const testCases = [
    {
      testName:
        'temperature module id exists and temp status is approaching temp',
      moduleId: temperatureModuleId,
      previousRobotState: () => robotApproachingTemp,
      temperature: 20,
      expected: {
        commands: [
          {
            command: 'temperatureModule/awaitTemperature',
            params: {
              module: temperatureModuleId,
              temperature: 20,
            },
          },
        ],
      },
    },
    {
      testName: 'no such moduleId',
      moduleId: 'someNonexistentModuleId',
      previousRobotState: () => robotState,
      temperature: 42,
      expected: missingModuleError,
    },
    {
      testName: 'null moduleId',
      moduleId: null,
      previousRobotState: () => robotState,
      temperature: 42,
      expected: missingModuleError,
    },
    {
      testName:
        'temperature module already at target temp and awaiting that same temp',
      moduleId: temperatureModuleId,
      temperature: 42,
      previousRobotState: () => robotAtTargetTemp,
      expected: {
        commands: [
          {
            command: 'temperatureModule/awaitTemperature',
            params: {
              module: temperatureModuleId,
              temperature: 42,
            },
          },
        ],
      },
    },
    {
      testName:
        'temperature module already at target temp and awaiting different temp',
      moduleId: temperatureModuleId,
      temperature: 80,
      previousRobotState: () => robotAtTargetTemp,
      expected: missingTempStep,
    },
    {
      testName: 'prev temp state is DEACTIVATED',
      moduleId: temperatureModuleId,
      temperature: 80,
      previousRobotState: () => robotState,
      expected: missingTempStep,
    },
  ]

  testCases.forEach(
    ({ expected, moduleId, testName, temperature, previousRobotState }) => {
      test(testName, () => {
        const args = { module: moduleId, temperature, commandCreatorFnName }
        const result = awaitTemperature(
          args,
          invariantContext,
          previousRobotState()
        )
        expect(result).toEqual(expected)
      })
    }
  )
})
