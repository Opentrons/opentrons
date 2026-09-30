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

  it('resolves moduleId when it is a string runtime parameter', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: vacuumModuleId,
      },
    }
    const result = vacuumStopPump(
      { moduleId: 'selected_module' },
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

  it('returns error if moduleId is not a string runtime parameter', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
    }
    const result = vacuumStopPump(
      { moduleId: 'mock_rtp' },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
