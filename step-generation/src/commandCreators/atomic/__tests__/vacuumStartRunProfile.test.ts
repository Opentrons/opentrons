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

import type {
  InvariantContext,
  RobotState,
  VacuumStartRunProfileArgs,
} from '../../../types'

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
    const args: VacuumStartRunProfileArgs = {
      moduleId: vacuumModuleId,
      commandCreatorFnName: 'vacuumStartRunProfile',
      ventAfter: true,
      profile: [
        {
          enablePump: true,
          holdSeconds: 12,
          gaugePressureMbar: 55,
          ventAfter: false,
        },
      ],
    }
    const result = vacuumStartRunProfile(args, invariantContext, robotState)
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/startRunProfile',
          key: expect.any(String),
          params: {
            moduleId: vacuumModuleId,
            profile: [{ ...args.profile[0], ventAfter: true }],
            taskId: 'mock_vacuum_module_task_1',
            ventAfter: true,
          },
        },
      ],
      python: `
mock_vacuum_module_task_1 = mock_vacuum_module.start_execute_profile(
    profile=[
        {
            "gauge_pressure_mbar": 55,
            "hold_time_seconds": 12,
            "vent_after": False,
        }
    ],
    repetitions=1,
    vent_after=True
)`.trim(),
    })
  })

  it('generates JSON and python for a sole cycle with repetitions (power steps)', () => {
    const args: VacuumStartRunProfileArgs = {
      commandCreatorFnName: 'vacuumStartRunProfile',
      moduleId: vacuumModuleId,
      profile: [
        {
          repetitions: 2,
          steps: [
            {
              enablePump: true,
              holdSeconds: 5,
              percentPower: 30,
              ventAfter: false,
            },
          ],
        },
      ],
      ventAfter: false,
    }
    const result = vacuumStartRunProfile(args, invariantContext, robotState)
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/startRunProfile',
          key: expect.any(String),
          params: {
            moduleId: vacuumModuleId,
            profile: [{ ...args.profile[0], ventAfter: false }],
            taskId: 'mock_vacuum_module_task_1',
            ventAfter: false,
          },
        },
      ],
      python: `
mock_vacuum_module_task_1 = mock_vacuum_module.start_execute_profile(
    profile=[
        {
            "percent_power": 30,
            "hold_time_seconds": 5,
            "vent_after": False,
        }
    ],
    repetitions=2,
    vent_after=False
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
        commandCreatorFnName: 'vacuumStartRunProfile',
        moduleId: vacuumModuleId,
        ventAfter: false,
        profile: [
          {
            enablePump: true,
            holdSeconds: 1,
            gaugePressureMbar: 1,
            ventAfter: false,
          },
        ],
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
        commandCreatorFnName: 'vacuumStartRunProfile',
        moduleId: vacuumModuleId,
        ventAfter: false,
        profile: [
          {
            enablePump: true,
            holdSeconds: 1,
            gaugePressureMbar: 1,
            ventAfter: false,
          },
        ],
      },
      invariantContext,
      busyRobot
    )
    expect(getErrorResult(result)).toEqual(liveTaskError)
  })
})
