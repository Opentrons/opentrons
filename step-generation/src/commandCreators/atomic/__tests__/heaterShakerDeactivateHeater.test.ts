import { beforeEach, describe, expect, it } from 'vitest'

import {
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
} from '@opentrons/shared-data'

import {
  getErrorResult,
  getInitialRobotStateStandard,
  makeContext,
} from '../../../fixtures'
import { heaterShakerDeactivateHeater } from '../heaterShakerDeactivateHeater'

import type { InvariantContext, RobotState } from '../../../types'

const moduleId = 'heaterShakerId'

describe('heaterShakerDeactivateHeater', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    invariantContext.moduleEntities[moduleId] = {
      id: moduleId,
      type: HEATERSHAKER_MODULE_TYPE,
      model: HEATERSHAKER_MODULE_V1,
      pythonName: 'mock_heater_shaker_1',
    }
    robotState = getInitialRobotStateStandard(invariantContext)
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
    const result = heaterShakerDeactivateHeater(
      {
        moduleId: 'selected_module',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'heaterShaker/deactivateHeater',
          key: expect.any(String),
          params: {
            moduleId,
          },
        },
      ],
      python: 'mock_heater_shaker_1.deactivate_heater()',
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
    const result = heaterShakerDeactivateHeater(
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
