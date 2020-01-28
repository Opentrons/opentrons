// @flow
import cloneDeep from 'lodash/cloneDeep'
import { makeImmutableStateUpdater } from './utils/makeImmutableStateUpdater'
import { makeContext, getInitialRobotStateStandard } from './fixtures'
import {
  forSetTemperature as _forSetTemperature,
  forDeactivateTemperature as _forDeactivateTemperature,
} from '../getNextRobotStateAndWarnings/temperatureUpdates'
import {
  TEMPERATURE_DEACTIVATED,
  TEMPERATURE_APPROACHING_TARGET,
} from '../../constants'
import type { RobotState } from '../types'

const forSetTemperature = makeImmutableStateUpdater(_forSetTemperature)
const forDeactivateTemperature = makeImmutableStateUpdater(
  _forDeactivateTemperature
)

function createRobotWithTemp(robot: RobotState, temperature: number) {
  const robotWithTemp = cloneDeep(robot)
  robotWithTemp.modules[moduleId].moduleState = {
    type: 'tempdeck',
    targetTemperature: temperature,
    status: TEMPERATURE_APPROACHING_TARGET,
  }
  return robotWithTemp
}

const moduleId = 'temperatureModuleId'
const slot = '3'
const temperature = 45
let invariantContext, deactivatedRobot, robotWithTemp
beforeEach(() => {
  invariantContext = makeContext()
  invariantContext.moduleEntities[moduleId] = {
    id: moduleId,
    type: 'tempdeck',
    model: 'GEN1',
  }

  deactivatedRobot = getInitialRobotStateStandard(invariantContext)
  deactivatedRobot.modules[moduleId] = {
    slot,
    moduleState: {
      type: 'tempdeck',
      targetTemperature: null,
      status: TEMPERATURE_DEACTIVATED,
    },
  }
  robotWithTemp = createRobotWithTemp(deactivatedRobot, temperature)
})

describe('forSetTemperature', () => {
  test('module status is set to approaching and temp is set to target', () => {
    const params = {
      module: moduleId,
      temperature: temperature,
    }

    const result = forSetTemperature(params, invariantContext, deactivatedRobot)

    expect(result).toEqual({
      robotState: robotWithTemp,
      warnings: [],
    })
  })

  test('module temp is changed to new target temp when already active', () => {
    const newTemperature = 55
    const params = {
      module: moduleId,
      temperature: newTemperature,
    }
    const robotWithNewTemp = createRobotWithTemp(robotWithTemp, newTemperature)

    const result = forSetTemperature(params, invariantContext, robotWithTemp)

    expect(result).toEqual({
      warnings: [],
      robotState: robotWithNewTemp,
    })
  })
})

describe('forDeactivateTemperature', () => {
  test('module status is deactivated and no temperature is set', () => {
    const params = {
      module: moduleId,
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

  test('no effect when temp module is not active', () => {
    const params = {
      module: moduleId,
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
