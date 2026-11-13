import cloneDeep from 'lodash/cloneDeep'
import merge from 'lodash/merge'
import { beforeEach, describe, expect, it } from 'vitest'

import { VACUUM_MODULE_TYPE, VACUUM_MODULE_V1 } from '@opentrons/shared-data'

import {
  VACUUM_MODE_PRESSURE,
  VACUUM_MODULE_INITIAL_STATE,
} from '../../../constants'
import {
  getErrorResult,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'
import { vacuumSetPumpPressure } from '../vacuumSetPumpPressure'

import type { InvariantContext, RobotState } from '../../../types'

const vacuumModuleId = 'vacuumModuleId'

let invariantContext: InvariantContext
let robotState: RobotState

beforeEach(() => {
  invariantContext = {
    ...makeContext(),
    moduleEntities: {
      [vacuumModuleId]: {
        id: vacuumModuleId,
        type: VACUUM_MODULE_TYPE,
        model: VACUUM_MODULE_V1,
        pythonName: 'mock_vacuum_module',
      },
    },
  }
  const base = getInitialRobotStateStandard(invariantContext)
  robotState = merge({}, cloneDeep(base), {
    modules: {
      [vacuumModuleId]: {
        slot: 'A3',
        moduleState: { ...VACUUM_MODULE_INITIAL_STATE },
      },
    },
  })
})

describe('vacuumSetPumpPressure', () => {
  const missingModuleError = {
    errors: [{ message: expect.any(String), type: 'MISSING_MODULE' }],
  }
  const liveTaskError = {
    errors: [{ message: expect.any(String), type: 'LIVE_TASK_ERROR' }],
  }

  it('generates JSON and python for an indefinite pressure hold (no duration)', () => {
    const result = vacuumSetPumpPressure(
      {
        moduleId: vacuumModuleId,
        gaugePressure: 150,
      },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/startSetVacuumPressure',
          key: expect.any(String),
          params: {
            moduleId: vacuumModuleId,
            gaugePressure: 150,
          },
        },
      ],
      python: `
mock_vacuum_module.start_set_vacuum_pressure(
    gauge_pressure_mbar=150
)`.trim(),
    })
  })

  it('generates JSON and python for a timed hold with task id from pump activity count', () => {
    const robotWithPriorTasks = merge({}, cloneDeep(robotState), {
      modules: {
        [vacuumModuleId]: {
          moduleState: {
            ...VACUUM_MODULE_INITIAL_STATE,
            numPumpActivitiesStarted: 2,
          },
        },
      },
    })
    const result = vacuumSetPumpPressure(
      {
        moduleId: vacuumModuleId,
        gaugePressure: 100,
        duration: 45,
        ventAfter: true,
      },
      invariantContext,
      robotWithPriorTasks
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/startSetVacuumPressure',
          key: expect.any(String),
          params: {
            moduleId: vacuumModuleId,
            gaugePressure: 100,
            duration: 45,
            ventAfter: true,
            taskId: 'mock_vacuum_module_task_3',
          },
        },
      ],
      python: `
mock_vacuum_module_task_3 = mock_vacuum_module.start_set_vacuum_pressure(
    gauge_pressure_mbar=100,
    duration_s=45,
    vent_after=True
)
`.trim(),
    })
  })

  it('returns missing module when moduleId is unknown', () => {
    const result = vacuumSetPumpPressure(
      {
        moduleId: 'missingVacuum',
        gaugePressure: 1,
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result)).toEqual(missingModuleError)
  })

  it('returns live task error when a timed hold is already active', () => {
    const busyRobot = merge({}, cloneDeep(robotState), {
      modules: {
        [vacuumModuleId]: {
          moduleState: {
            ...VACUUM_MODULE_INITIAL_STATE,
            currentPumpActivity: {
              type: 'timedHold',
              mode: VACUUM_MODE_PRESSURE,
              targetPressure: 50,
              durationSeconds: 10,
              taskId: 't-1',
              ventAfter: true,
            },
          },
        },
      },
    })
    const result = vacuumSetPumpPressure(
      {
        moduleId: vacuumModuleId,
        gaugePressure: 200,
      },
      invariantContext,
      busyRobot
    )
    expect(getErrorResult(result)).toEqual(liveTaskError)
  })

  it('resolves all args when they are runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: vacuumModuleId,
      },
      gauge_pressure: {
        variableName: 'gauge_pressure',
        displayName: 'Gauge pressure',
        type: 'int',
        default: 100,
      },
      hold_duration: {
        variableName: 'hold_duration',
        displayName: 'Hold duration',
        type: 'int',
        default: 45,
      },
      vent_after: {
        variableName: 'vent_after',
        displayName: 'Vent after',
        type: 'boolean',
        default: true,
      },
    }
    const result = vacuumSetPumpPressure(
      {
        moduleId: 'selected_module',
        gaugePressure: 'gauge_pressure',
        duration: 'hold_duration',
        ventAfter: 'vent_after',
      },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/startSetVacuumPressure',
          key: expect.any(String),
          params: {
            moduleId: vacuumModuleId,
            gaugePressure: 100,
            duration: 45,
            ventAfter: true,
            taskId: 'mock_vacuum_module_task_1',
          },
        },
      ],
      python: `
mock_vacuum_module_task_1 = mock_vacuum_module.start_set_vacuum_pressure(
    gauge_pressure_mbar=gauge_pressure,
    duration_s=hold_duration,
    vent_after=vent_after
)`.trim(),
    })
  })

  it('returns errors if runtime parameters are missing or invalid', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
      hold_duration: {
        variableName: 'hold_duration',
        displayName: 'Hold duration',
        type: 'int',
        default: 45,
      },
    }
    const result = vacuumSetPumpPressure(
      {
        moduleId: 'mock_rtp',
        gaugePressure: 'missing_pressure',
        duration: 'missing_duration',
        ventAfter: 'hold_duration',
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "missing_pressure" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "missing_duration" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "hold_duration" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
