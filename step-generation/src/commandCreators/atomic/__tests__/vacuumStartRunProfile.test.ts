import cloneDeep from 'lodash/cloneDeep'
import merge from 'lodash/merge'
import { beforeEach, describe, expect, it } from 'vitest'

import { VACUUM_MODULE_TYPE, VACUUM_MODULE_V1 } from '@opentrons/shared-data'

import {
  VACUUM_MODE_POWER,
  VACUUM_MODULE_INITIAL_STATE,
} from '../../../constants'
import {
  getErrorResult,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'
import { vacuumStartRunProfile } from '../vacuumStartRunProfile'

import type { VacuumModuleStartRunProfileCreateCommand } from '@opentrons/shared-data'
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

describe('vacuumStartRunProfile', () => {
  const missingModuleError = {
    errors: [{ message: expect.any(String), type: 'MISSING_MODULE' }],
  }
  const liveTaskError = {
    errors: [{ message: expect.any(String), type: 'LIVE_TASK_ERROR' }],
  }

  it('generates JSON and python for a single atomic profile step with ventAfter', () => {
    const params: VacuumModuleStartRunProfileCreateCommand['params'] = {
      moduleId: vacuumModuleId,
      profile: [{ holdSeconds: 12, pressureMbar: 55 }],
      ventAfter: true,
    }
    const result = vacuumStartRunProfile(params, invariantContext, robotState)
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/startRunProfile',
          key: expect.any(String),
          params: {
            moduleId: vacuumModuleId,
            profile: params.profile,
            ventAfter: true,
            taskId: 'mock_vacuum_module_task_1',
          },
        },
      ],
      python: `
mock_vacuum_module_task_1 = mock_vacuum_module.start_execute_profile(
    profile=[
        {"gauge_pressure": 55, "hold_time_seconds": 12}
    ],
    repetitions=1,
    vent_after=True
)`.trim(),
    })
  })

  it('generates JSON and python for a sole cycle with repetitions (power steps)', () => {
    const params: VacuumModuleStartRunProfileCreateCommand['params'] = {
      moduleId: vacuumModuleId,
      profile: [
        {
          repetitions: 2,
          steps: [{ holdSeconds: 5, powerPercent: 30 }],
        },
      ],
      ventAfter: false,
    }
    const result = vacuumStartRunProfile(params, invariantContext, robotState)
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/startRunProfile',
          key: expect.any(String),
          params: {
            moduleId: vacuumModuleId,
            profile: params.profile,
            ventAfter: false,
            taskId: 'mock_vacuum_module_task_1',
          },
        },
      ],
      python: `
mock_vacuum_module_task_1 = mock_vacuum_module.start_execute_profile(
    profile=[
        {"power_percent": 30, "hold_time_seconds": 5}
    ],
    repetitions=2
)`.trim(),
    })
  })

  it('returns missing module when the vacuum module is not on the robot', () => {
    const robotNoVacuum: RobotState = {
      ...cloneDeep(robotState),
      modules: {},
    }
    const result = vacuumStartRunProfile(
      {
        moduleId: vacuumModuleId,
        profile: [{ holdSeconds: 1, pressureMbar: 1 }],
      },
      invariantContext,
      robotNoVacuum
    )
    expect(getErrorResult(result)).toEqual(missingModuleError)
  })

  it('returns live task error when a timed hold is active', () => {
    const busyRobot = merge({}, cloneDeep(robotState), {
      modules: {
        [vacuumModuleId]: {
          moduleState: {
            ...VACUUM_MODULE_INITIAL_STATE,
            currentPumpActivity: {
              type: 'timedHold',
              mode: VACUUM_MODE_POWER,
              targetPower: 50,
              durationSeconds: 3,
              taskId: 'x',
              ventAfter: true,
            },
          },
        },
      },
    })
    const result = vacuumStartRunProfile(
      {
        moduleId: vacuumModuleId,
        profile: [{ holdSeconds: 1, pressureMbar: 1 }],
      },
      invariantContext,
      busyRobot
    )
    expect(getErrorResult(result)).toEqual(liveTaskError)
  })
})
