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
import { engageMagnet } from '../engageMagnet'

import type { InvariantContext, RobotState } from '../../../types'

const moduleId = 'magneticModuleId'
describe('engageMagnet', () => {
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
  it('creates engage magnet command', () => {
    const height = 2
    const result = engageMagnet(
      {
        moduleId,
        height,
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'magneticModule/engage',
          key: expect.any(String),
          params: {
            moduleId,
            height,
          },
        },
      ],
      python: `mock_magnetic_module_1.engage(height_from_base=${height})`,
    })
  })
  it('resolves moduleId and height when they are runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: moduleId,
      },
      engage_height: {
        variableName: 'engage_height',
        displayName: 'Engage height',
        type: 'int',
        default: 2,
      },
    }
    const result = engageMagnet(
      {
        moduleId: 'selected_module',
        height: 'engage_height',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'magneticModule/engage',
          key: expect.any(String),
          params: {
            moduleId,
            height: 2,
          },
        },
      ],
      python: 'mock_magnetic_module_1.engage(height_from_base=engage_height)',
    })
  })
  it('returns errors if moduleId and height are not valid runtime parameters', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
      mock_string_rtp: {
        variableName: 'mock_string_rtp',
        displayName: 'mock string rtp',
        type: 'string',
        default: 'mock',
      },
    }
    const result = engageMagnet(
      {
        moduleId: 'mock_rtp',
        height: 'mock_string_rtp',
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
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
