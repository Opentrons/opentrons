import { beforeEach, describe, expect, it } from 'vitest'

import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
} from '@opentrons/shared-data'

import {
  getErrorResult,
  getInitialRobotStateStandard,
  makeContext,
} from '../../../fixtures'
import { disengageMagnet } from '../disengageMagnet'

import type { InvariantContext, RobotState } from '../../../types'

const moduleId = 'magneticModuleId'

describe('disengageMagnet', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    invariantContext.moduleEntities[moduleId] = {
      id: moduleId,
      type: MAGNETIC_MODULE_TYPE,
      model: MAGNETIC_MODULE_V1,
      pythonName: 'mock_magnetic_module_1',
    }
    robotState = getInitialRobotStateStandard(invariantContext)
    robotState.modules[moduleId] = {
      slot: '4',
      moduleState: {
        type: MAGNETIC_MODULE_TYPE,
        engaged: false,
      },
    }
  })
  it('creates disengage magnet command', () => {
    const result = disengageMagnet(
      {
        moduleId,
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'magneticModule/disengage',
          key: expect.any(String),
          params: {
            moduleId,
          },
        },
      ],
      python: 'mock_magnetic_module_1.disengage()',
    })
  })
  it('resolves moduleId when it is a string runtime parameter', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: moduleId,
      },
    }
    const result = disengageMagnet(
      {
        moduleId: 'selected_module',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'magneticModule/disengage',
          key: expect.any(String),
          params: {
            moduleId,
          },
        },
      ],
      python: 'mock_magnetic_module_1.disengage()',
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
    const result = disengageMagnet(
      {
        moduleId: 'mock_rtp',
      },
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
