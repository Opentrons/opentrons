import {
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_DEACTIVATED,
} from '../constants'
import { waitForTemperature } from '../commandCreators/atomic/waitForTemperature'
import {
  getStateAndContextTempTCModules,
  robotWithStatusAndTemp,
} from '../fixtures'
import { WaitForTemperatureArgs, InvariantContext, RobotState } from '../types'

describe('waitForTemperature', () => {
  const temperatureModuleId = 'temperatureModuleId'
  const thermocyclerId = 'thermocyclerId'
  const commandCreatorFnName = 'waitForTemperature'
  const prevRobotTemp = 42
  const missingModuleError = {
    errors: [
      {
        message: expect.any(String),
        type: 'MISSING_MODULE',
      },
    ],
  }
  const missingTemperatureStep = {
    errors: [
      {
        message: expect.any(String),
        type: 'MISSING_TEMPERATURE_STEP',
      },
    ],
  }
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
  it('temperature module id exists and temp status is approaching temp', () => {
    const temperature = 20
    const args: WaitForTemperatureArgs = {
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
          commandType: 'temperatureModule/waitForTemperature',
          key: expect.any(String),
          params: {
            moduleId: temperatureModuleId,
            celsius: 20,
          },
        },
      ],
    }
    const result = waitForTemperature(
      args,
      invariantContext,
      previousRobotState
    )
    expect(result).toEqual(expected)
  })
  it('returns missing module error when module id does not exist', () => {
    const temperature = 42
    const args: WaitForTemperatureArgs = {
      module: 'someNonexistentModuleId',
      temperature,
      commandCreatorFnName,
    }
    const result = waitForTemperature(args, invariantContext, robotState)
    expect(result).toEqual(missingModuleError)
  })
  it('returns missing module error when module id is null', () => {
    const temperature = 42
    const args: WaitForTemperatureArgs = {
      module: null,
      temperature,
      commandCreatorFnName,
    }
    const result = waitForTemperature(args, invariantContext, robotState)
    expect(result).toEqual(missingModuleError)
  })
  it('returns waitForTemperature command creator when temperature module already at target temp and awaiting that same temp', () => {
    const temperature = 42
    const args: WaitForTemperatureArgs = {
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
          commandType: 'temperatureModule/waitForTemperature',
          key: expect.any(String),
          params: {
            moduleId: temperatureModuleId,
            celsius: 42,
          },
        },
      ],
    }
    const result = waitForTemperature(
      args,
      invariantContext,
      previousRobotState
    )
    expect(result).toEqual(expected)
  })
  it('returns missing temperature step error when temperature module already at target temp and awaiting different temp', () => {
    const temperature = 80
    const args: WaitForTemperatureArgs = {
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
    const result = waitForTemperature(
      args,
      invariantContext,
      previousRobotState
    )
    expect(result).toEqual(missingTemperatureStep)
  })
  it('returns missing temperature step error when prev temp state is DEACTIVATED', () => {
    const temperature = 80
    const args: WaitForTemperatureArgs = {
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
    const result = waitForTemperature(
      args,
      invariantContext,
      previousRobotState
    )
    expect(result).toEqual(missingTemperatureStep)
  })
})
