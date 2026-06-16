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
        commandCreatorFnName: 'vacuumSetPumpPressure',
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
        commandCreatorFnName: 'vacuumSetPumpPressure',
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
mock_vacuum_module.start_set_vacuum_pressure(
    gauge_pressure_mbar=100,
    duration_s=45,
    vent_after=True
)
mock_vacuum_module_task_3 = protocol.create_timer(seconds=45)
`.trim(),
    })
  })

  it('returns missing module when moduleId is unknown', () => {
    const result = vacuumSetPumpPressure(
      {
        moduleId: 'missingVacuum',
        commandCreatorFnName: 'vacuumSetPumpPressure',
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
        commandCreatorFnName: 'vacuumSetPumpPressure',
        gaugePressure: 200,
      },
      invariantContext,
      busyRobot
    )
    expect(getErrorResult(result)).toEqual(liveTaskError)
  })
})
