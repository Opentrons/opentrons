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

const forSetTemperature = makeImmutableStateUpdater(_forSetTemperature)
const forDeactivateTemperature = makeImmutableStateUpdater(
  _forDeactivateTemperature
)
const moduleId = 'temperatureModuleId'
const slot = '3'
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
  robotWithTemp = cloneDeep(deactivatedRobot)
  robotWithTemp.modules[moduleId].moduleState = {
    type: 'tempdeck',
    targetTemperature: 45,
    status: TEMPERATURE_APPROACHING_TARGET,
  }
})

describe('forSetTemperature', () => {
  test('module status is set to approaching and temp is set to target', () => {
    const params = {
      module: moduleId,
      temperature: 45,
    }

    const result = forSetTemperature(params, invariantContext, deactivatedRobot)

    expect(result).toEqual({
      robotState: robotWithTemp,
      warnings: [],
    })
  })

  test('module temp is changed to new target temp when already active', () => {
    const params = {
      module: moduleId,
      temperature: 55,
    }

    const result = forSetTemperature(params, invariantContext, deactivatedRobot)

    expect(result).toEqual({
      warnings: [],
      robotState: {
        ...robotWithTemp,
        modules: {
          [moduleId]: {
            moduleState: {
              type: 'tempdeck',
              targetTemperature: 55,
              status: TEMPERATURE_APPROACHING_TARGET,
            },
            slot,
          },
        },
      },
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
