import { beforeEach, describe, expect, it } from 'vitest'

import { VACUUM_MODULE_TYPE, VACUUM_MODULE_V1 } from '@opentrons/shared-data'

import {
  getErrorResult,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'
import { vacuumStopPump } from '../vacuumStopPump'

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
  robotState = getInitialRobotStateStandard(invariantContext)
})

describe('vacuumStopPump', () => {
  const missingModuleError = {
    errors: [{ message: expect.any(String), type: 'MISSING_MODULE' }],
  }

  it('generates JSON and python when the module entity exists', () => {
    const result = vacuumStopPump(
      { moduleId: vacuumModuleId },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/stopVacuum',
          key: expect.any(String),
          params: { moduleId: vacuumModuleId },
        },
      ],
      python: 'mock_vacuum_module.stop_vacuum_pump()',
    })
  })

  it('returns missing module when moduleId is unknown', () => {
    const result = vacuumStopPump(
      { moduleId: 'missingVacuum' },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result)).toEqual(missingModuleError)
  })
})
