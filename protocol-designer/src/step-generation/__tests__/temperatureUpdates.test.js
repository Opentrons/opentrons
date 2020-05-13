// @flow
import {
  TEMPERATURE_DEACTIVATED,
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_AT_TARGET,
} from '../../constants'
import {
  forSetTemperature as _forSetTemperature,
  forDeactivateTemperature as _forDeactivateTemperature,
  forAwaitTemperature as _forAwaitTemperature,
} from '../getNextRobotStateAndWarnings/temperatureUpdates'
import { makeImmutableStateUpdater } from '../__utils__/makeImmutableStateUpdater'
import {
  getStateAndContextTempTCModules,
  robotWithStatusAndTemp,
} from '../__fixtures__/robotStateFixtures'

const forSetTemperature = makeImmutableStateUpdater(_forSetTemperature)
const forDeactivateTemperature = makeImmutableStateUpdater(
  _forDeactivateTemperature
)
const forAwaitTemperature = makeImmutableStateUpdater(_forAwaitTemperature)

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'
const temperature = 45
let invariantContext, deactivatedRobot, robotWithTemp, robotState

beforeEach(() => {
  const stateAndContext = getStateAndContextTempTCModules({
    temperatureModuleId,
    thermocyclerId,
  })
  invariantContext = stateAndContext.invariantContext
  robotState = stateAndContext.robotState

  deactivatedRobot = robotWithStatusAndTemp(
    robotState,
    temperatureModuleId,
    TEMPERATURE_DEACTIVATED,
    null
  )
  robotWithTemp = robotWithStatusAndTemp(
    robotState,
    temperatureModuleId,
    TEMPERATURE_APPROACHING_TARGET,
    temperature
  )
})

describe('forSetTemperature', () => {
  it('module status is set to approaching and temp is set to target', () => {
    const params = {
      module: temperatureModuleId,
      temperature: temperature,
    }

    const result = forSetTemperature(params, invariantContext, deactivatedRobot)

    expect(result).toEqual({
      robotState: robotWithStatusAndTemp(
        deactivatedRobot,
        temperatureModuleId,
        TEMPERATURE_APPROACHING_TARGET,
        temperature
      ),
      warnings: [],
    })
  })

  it('module temp is changed to new target temp when already active', () => {
    const newTemperature = 55
    const params = {
      module: temperatureModuleId,
      temperature: newTemperature,
    }

    const result = forSetTemperature(
      params,
      invariantContext,
      robotWithStatusAndTemp(
        deactivatedRobot,
        temperatureModuleId,
        TEMPERATURE_APPROACHING_TARGET,
        temperature
      )
    )

    expect(result).toEqual({
      warnings: [],
      robotState: robotWithStatusAndTemp(
        deactivatedRobot,
        temperatureModuleId,
        TEMPERATURE_APPROACHING_TARGET,
        newTemperature
      ),
    })
  })
})

describe('forDeactivateTemperature', () => {
  it('module status is deactivated and no temperature is set', () => {
    const params = {
      module: temperatureModuleId,
    }

    const result = forDeactivateTemperature(
      params,
      invariantContext,
      robotWithTemp
    )

    expect(result).toEqual({
      robotState: deactivatedRobot,
      warnings: [],
    })
  })

  it('no effect when temp module is not active', () => {
    const params = {
      module: temperatureModuleId,
    }

    const result = forDeactivateTemperature(
      params,
      invariantContext,
      deactivatedRobot
    )

    expect(result).toEqual({
      robotState: deactivatedRobot,
      warnings: [],
    })
  })
})

describe('forAwaitTemperature', () => {
  ;[TEMPERATURE_AT_TARGET, TEMPERATURE_APPROACHING_TARGET].forEach(status => {
    it(`update status to 'at target' when previous status is ${status} and the given target temp matches the previous target temp`, () => {
      const params = {
        module: temperatureModuleId,
        temperature: temperature,
      }

      const prevRobotState = robotWithStatusAndTemp(
        deactivatedRobot,
        temperatureModuleId,
        status,
        temperature
      )

      const robotAtTargetTemp = robotWithStatusAndTemp(
        robotWithTemp,
        temperatureModuleId,
        TEMPERATURE_AT_TARGET,
        temperature
      )

      const result = forAwaitTemperature(
        params,
        invariantContext,
        prevRobotState
      )

      expect(result).toEqual({
        robotState: robotAtTargetTemp,
        warnings: [],
      })
    })
  })

  it(`keep status at 'appraoching target temperature' when actively approaching target`, () => {
    const params = {
      module: temperatureModuleId,
      temperature: 55,
    }
    const robotAtNonTargetTemp = robotWithStatusAndTemp(
      deactivatedRobot,
      temperatureModuleId,
      TEMPERATURE_APPROACHING_TARGET,
      temperature
    )
    const result = forAwaitTemperature(
      params,
      invariantContext,
      robotAtNonTargetTemp
    )
    expect(result).toEqual({
      robotState: robotAtNonTargetTemp,
      warnings: [],
    })
  })
})
