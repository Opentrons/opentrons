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
import { vacuumCloseVent } from '../vacuumCloseVent'

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

describe('vacuumCloseVent', () => {
  const missingModuleError = {
    errors: [{ message: expect.any(String), type: 'MISSING_MODULE' }],
  }
  const liveTaskError = {
    errors: [{ message: expect.any(String), type: 'LIVE_TASK_ERROR' }],
  }

  it('generates JSON and python when the module is present and idle', () => {
    const result = vacuumCloseVent(
      { moduleId: vacuumModuleId, commandCreatorFnName: 'vacuumCloseVent' },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/closeVent',
          key: expect.any(String),
          params: { moduleId: vacuumModuleId },
        },
      ],
      python: 'mock_vacuum_module.close_vent()',
    })
  })

  it('returns missing module when moduleId is unknown', () => {
    const result = vacuumCloseVent(
      { moduleId: 'missingVacuum', commandCreatorFnName: 'vacuumCloseVent' },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result)).toEqual(missingModuleError)
  })

  it('returns live task error when a profile run is active', () => {
    const busyRobot = merge({}, cloneDeep(robotState), {
      modules: {
        [vacuumModuleId]: {
          moduleState: {
            ...VACUUM_MODULE_INITIAL_STATE,
            currentPumpActivity: {
              type: 'profile',
              profileElements: [{ holdSeconds: 1, pressureMbar: 10 }],
              taskId: 'prof-1',
              ventAfter: false,
            },
          },
        },
      },
    })
    const result = vacuumCloseVent(
      { moduleId: vacuumModuleId, commandCreatorFnName: 'vacuumCloseVent' },
      invariantContext,
      busyRobot
    )
    expect(getErrorResult(result)).toEqual(liveTaskError)
  })
})
