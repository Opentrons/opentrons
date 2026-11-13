import cloneDeep from 'lodash/cloneDeep'
import merge from 'lodash/merge'
import { beforeEach, describe, expect, it } from 'vitest'

import { VACUUM_MODULE_TYPE, VACUUM_MODULE_V1 } from '@opentrons/shared-data'

import { VACUUM_MODULE_INITIAL_STATE } from '../../../constants'
import {
  getErrorResult,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'
import { vacuumSetPumpPower } from '../vacuumSetPumpPower'

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

describe('vacuumSetPumpPower', () => {
  const missingModuleError = {
    errors: [{ message: expect.any(String), type: 'MISSING_MODULE' }],
  }
  const liveTaskError = {
    errors: [{ message: expect.any(String), type: 'LIVE_TASK_ERROR' }],
  }

  it('generates JSON and python for an indefinite power hold (no duration)', () => {
    const result = vacuumSetPumpPower(
      {
        moduleId: vacuumModuleId,
        percentPower: 75,
      },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/startSetVacuumPower',
          key: expect.any(String),
          params: {
            moduleId: vacuumModuleId,
            percentPower: 75,
          },
        },
      ],
      python: `
mock_vacuum_module.start_set_vacuum_power(
    percent_power=75
)`.trim(),
    })
  })

  it('generates JSON and python for a timed power hold', () => {
    const result = vacuumSetPumpPower(
      {
        moduleId: vacuumModuleId,
        percentPower: 40,
        duration: 120,
        ventAfter: false,
      },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/startSetVacuumPower',
          key: expect.any(String),
          params: {
            moduleId: vacuumModuleId,
            percentPower: 40,
            duration: 120,
            ventAfter: false,
            taskId: 'mock_vacuum_module_task_1',
          },
        },
      ],
      python: `
mock_vacuum_module_task_1 = mock_vacuum_module.start_set_vacuum_power(
    percent_power=40,
    duration_s=120,
    vent_after=False
)`.trim(),
    })
  })

  it('returns missing module when moduleId is unknown', () => {
    const result = vacuumSetPumpPower(
      {
        moduleId: 'missingVacuum',
        percentPower: 50,
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result)).toEqual(missingModuleError)
  })

  it('returns live task error when a profile is already running', () => {
    const busyRobot = merge({}, cloneDeep(robotState), {
      modules: {
        [vacuumModuleId]: {
          moduleState: {
            ...VACUUM_MODULE_INITIAL_STATE,
            currentPumpActivity: {
              type: 'profile',
              profileElements: [{ holdSeconds: 2, percentPower: 20 }],
              taskId: 'p-1',
              ventAfter: true,
            },
          },
        },
      },
    })
    const result = vacuumSetPumpPower(
      {
        moduleId: vacuumModuleId,
        percentPower: 10,
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
      percent_power: {
        variableName: 'percent_power',
        displayName: 'Percent power',
        type: 'int',
        default: 40,
      },
      hold_duration: {
        variableName: 'hold_duration',
        displayName: 'Hold duration',
        type: 'int',
        default: 120,
      },
      vent_after: {
        variableName: 'vent_after',
        displayName: 'Vent after',
        type: 'boolean',
        default: false,
      },
    }
    const result = vacuumSetPumpPower(
      {
        moduleId: 'selected_module',
        percentPower: 'percent_power',
        duration: 'hold_duration',
        ventAfter: 'vent_after',
      },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/startSetVacuumPower',
          key: expect.any(String),
          params: {
            moduleId: vacuumModuleId,
            percentPower: 40,
            duration: 120,
            ventAfter: false,
            taskId: 'mock_vacuum_module_task_1',
          },
        },
      ],
      python: `
mock_vacuum_module_task_1 = mock_vacuum_module.start_set_vacuum_power(
    percent_power=percent_power,
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
        default: 120,
      },
    }
    const result = vacuumSetPumpPower(
      {
        moduleId: 'mock_rtp',
        percentPower: 'missing_power',
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
        message: 'Runtime parameter "missing_power" is missing',
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
