// @flow
import cloneDeep from 'lodash/cloneDeep'
import {
  TEMPERATURE_AT_TARGET,
  TEMPDECK,
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_DEACTIVATED,
} from '../../constants'
import { awaitTemperature } from '../commandCreators/atomic/awaitTemperature'
import { getStateAndContextTempMagModules } from './fixtures'
import type { RobotState } from '../types'

const robotWithStatus = (
  robotState: RobotState,
  temperatureModuleId: string,
  status:
    | typeof TEMPERATURE_AT_TARGET
    | typeof TEMPERATURE_APPROACHING_TARGET
    | typeof TEMPERATURE_DEACTIVATED
): RobotState => {
  const robot = cloneDeep(robotState)
  robot.modules[temperatureModuleId].moduleState = {
    type: TEMPDECK,
    targetTemperature: 42,
    status,
  }
  return robot
}

describe('awaitTemperature', () => {
  const temperatureModuleId = 'temperatureModuleId'
  const thermocyclerId = 'thermocyclerId'
  const commandCreatorFnName = 'awaitTemperature'

  const missingModuleError = {
    errors: [{ message: expect.any(String), type: 'MISSING_MODULE' }],
  }
  const missingTemperatureStep = {
    errors: [{ message: expect.any(String), type: 'MISSING_TEMPERATURE_STEP' }],
  }

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

  test('temperature module id exists and temp status is approaching temp', () => {
    const temperature = 20
    const args = {
      module: temperatureModuleId,
      temperature,
      commandCreatorFnName,
    }
    const previousRobotState = robotWithStatus(
      robotState,
      temperatureModuleId,
      TEMPERATURE_APPROACHING_TARGET
    )

    const expected = {
      commands: [
        {
          command: 'temperatureModule/awaitTemperature',
          params: {
            module: temperatureModuleId,
            temperature: 20,
          },
        },
      ],
    }
    const result = awaitTemperature(args, invariantContext, previousRobotState)
    expect(result).toEqual(expected)
  })
  test('module id does not exist', () => {
    const temperature = 42
    const args = {
      module: 'someNonexistentModuleId',
      temperature,
      commandCreatorFnName,
    }

    const result = awaitTemperature(args, invariantContext, robotState)
    expect(result).toEqual(missingModuleError)
  })
  test('module id is null', () => {
    const temperature = 42
    const args = {
      module: null,
      temperature,
      commandCreatorFnName,
    }

    const result = awaitTemperature(args, invariantContext, robotState)
    expect(result).toEqual(missingModuleError)
  })
  test('temperature module already at target temp and awaiting that same temp', () => {
    const temperature = 42
    const args = {
      module: temperatureModuleId,
      temperature,
      commandCreatorFnName,
    }
    const previousRobotState = robotWithStatus(
      robotState,
      temperatureModuleId,
      TEMPERATURE_AT_TARGET
    )
    const expected = {
      commands: [
        {
          command: 'temperatureModule/awaitTemperature',
          params: {
            module: temperatureModuleId,
            temperature: 42,
          },
        },
      ],
    }
    const result = awaitTemperature(args, invariantContext, previousRobotState)
    expect(result).toEqual(expected)
  })
  test('temperature module already at target temp and awaiting different temp', () => {
    const temperature = 80
    const args = {
      module: temperatureModuleId,
      temperature,
      commandCreatorFnName,
    }

    const previousRobotState = robotWithStatus(
      robotState,
      temperatureModuleId,
      TEMPERATURE_AT_TARGET
    )

    const result = awaitTemperature(args, invariantContext, previousRobotState)
    expect(result).toEqual(missingTemperatureStep)
  })
  test('prev temp state is DEACTIVATED', () => {
    const temperature = 80
    const args = {
      module: temperatureModuleId,
      temperature,
      commandCreatorFnName,
    }
    const previousRobotState = robotWithStatus(
      robotState,
      temperatureModuleId,
      TEMPERATURE_DEACTIVATED
    )

    const result = awaitTemperature(args, invariantContext, previousRobotState)
    expect(result).toEqual(missingTemperatureStep)
  })
})
