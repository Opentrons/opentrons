// @flow
import {
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_DEACTIVATED,
} from '../../constants'
import { awaitTemperature } from '../commandCreators/atomic/awaitTemperature'
import {
  getStateAndContextTempMagModules,
  robotWithStatusAndTemp,
} from '../__fixtures__'

describe('awaitTemperature', () => {
  const temperatureModuleId = 'temperatureModuleId'
  const thermocyclerId = 'thermocyclerId'
  const commandCreatorFnName = 'awaitTemperature'
  const prevRobotTemp = 42

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
    const previousRobotState = robotWithStatusAndTemp(
      robotState,
      temperatureModuleId,
      TEMPERATURE_APPROACHING_TARGET,
      prevRobotTemp
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
  test('returns missing module error when module id does not exist', () => {
    const temperature = 42
    const args = {
      module: 'someNonexistentModuleId',
      temperature,
      commandCreatorFnName,
    }

    const result = awaitTemperature(args, invariantContext, robotState)
    expect(result).toEqual(missingModuleError)
  })
  test('returns missing module error when module id is null', () => {
    const temperature = 42
    const args = {
      module: null,
      temperature,
      commandCreatorFnName,
    }

    const result = awaitTemperature(args, invariantContext, robotState)
    expect(result).toEqual(missingModuleError)
  })
  test('returns awaitTemperature command creator when temperature module already at target temp and awaiting that same temp', () => {
    const temperature = 42
    const args = {
      module: temperatureModuleId,
      temperature,
      commandCreatorFnName,
    }
    const previousRobotState = robotWithStatusAndTemp(
      robotState,
      temperatureModuleId,
      TEMPERATURE_AT_TARGET,
      prevRobotTemp
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
  test('returns missing temperature step error when temperature module already at target temp and awaiting different temp', () => {
    const temperature = 80
    const args = {
      module: temperatureModuleId,
      temperature,
      commandCreatorFnName,
    }

    const previousRobotState = robotWithStatusAndTemp(
      robotState,
      temperatureModuleId,
      TEMPERATURE_AT_TARGET,
      prevRobotTemp
    )

    const result = awaitTemperature(args, invariantContext, previousRobotState)
    expect(result).toEqual(missingTemperatureStep)
  })
  test('returns missing temperature step error when prev temp state is DEACTIVATED', () => {
    const temperature = 80
    const args = {
      module: temperatureModuleId,
      temperature,
      commandCreatorFnName,
    }
    const previousRobotState = robotWithStatusAndTemp(
      robotState,
      temperatureModuleId,
      TEMPERATURE_DEACTIVATED,
      prevRobotTemp
    )

    const result = awaitTemperature(args, invariantContext, previousRobotState)
    expect(result).toEqual(missingTemperatureStep)
  })
})
