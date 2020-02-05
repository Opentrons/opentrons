// @flow
import cloneDeep from 'lodash/cloneDeep'
import { makeImmutableStateUpdater } from './utils/makeImmutableStateUpdater'
import { makeContext, getInitialRobotStateStandard } from './fixtures'
import {
  forSetTemperature as _forSetTemperature,
  forDeactivateTemperature as _forDeactivateTemperature,
  forAwaitTemperature as _forAwaitTemperature,
} from '../getNextRobotStateAndWarnings/temperatureUpdates'
import {
  TEMPERATURE_DEACTIVATED,
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_AT_TARGET,
} from '../../constants'
import type { RobotState } from '../types'

const forSetTemperature = makeImmutableStateUpdater(_forSetTemperature)
const forDeactivateTemperature = makeImmutableStateUpdater(
  _forDeactivateTemperature
)
const forAwaitTemperature = makeImmutableStateUpdater(_forAwaitTemperature)

const moduleId = 'temperatureModuleId'
const slot = '3'
const temperature = 45
let invariantContext, deactivatedRobot, robotWithTemp

const createRobotWithTemp = (
  robot: RobotState,
  targetTemperature: number,
  status:
    | typeof TEMPERATURE_DEACTIVATED
    | typeof TEMPERATURE_APPROACHING_TARGET
    | typeof TEMPERATURE_AT_TARGET
) => {
  const robotWithTemp = cloneDeep(robot)
  robotWithTemp.modules[moduleId].moduleState = {
    type: 'tempdeck',
    targetTemperature,
    status,
  }
  return robotWithTemp
}

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
  robotWithTemp = createRobotWithTemp(
    deactivatedRobot,
    temperature,
    TEMPERATURE_APPROACHING_TARGET
  )
})

describe('forSetTemperature', () => {
  test('module status is set to approaching and temp is set to target', () => {
    const params = {
      module: moduleId,
      temperature: temperature,
    }

    const result = forSetTemperature(params, invariantContext, deactivatedRobot)

    expect(result).toEqual({
      robotState: createRobotWithTemp(
        deactivatedRobot,
        temperature,
        TEMPERATURE_APPROACHING_TARGET
      ),
      warnings: [],
    })
  })

  test('module temp is changed to new target temp when already active', () => {
    const newTemperature = 55
    const params = {
      module: moduleId,
      temperature: newTemperature,
    }

    const result = forSetTemperature(
      params,
      invariantContext,
      createRobotWithTemp(
        deactivatedRobot,
        temperature,
        TEMPERATURE_APPROACHING_TARGET
      )
    )

    expect(result).toEqual({
      warnings: [],
      robotState: createRobotWithTemp(
        deactivatedRobot,
        newTemperature,
        TEMPERATURE_APPROACHING_TARGET
      ),
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

describe('forAwaitTemperature', () => {
  ;[TEMPERATURE_AT_TARGET, TEMPERATURE_APPROACHING_TARGET].forEach(status => {
    test(`awaited temp equals previous state target temp when previous status is ${status}`, () => {
      const params = {
        module: moduleId,
        temperature: temperature,
      }
      const result = forAwaitTemperature(
        params,
        invariantContext,
        createRobotWithTemp(deactivatedRobot, temperature, status)
      )

      expect(result).toEqual({
        robotState: createRobotWithTemp(
          robotWithTemp,
          temperature,
          TEMPERATURE_AT_TARGET
        ),
        warnings: [],
      })
    })
  })

  test('await non-target temperature when actively approaching target', () => {
    const params = {
      module: moduleId,
      temperature: 55,
    }
    const robotAtNonTargetTemp = createRobotWithTemp(
      deactivatedRobot,
      temperature,
      TEMPERATURE_APPROACHING_TARGET
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
