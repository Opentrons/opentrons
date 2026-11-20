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
import { heaterShakerSetTargetShakeSpeed } from '../heaterShakerSetTargetShakeSpeed'

import type { InvariantContext, RobotState } from '../../../types'

const moduleId = 'heaterShakerId'

describe('heaterShakerSetTargetShakeSpeed', () => {
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
  it('resolves moduleId and rpm when they are runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: moduleId,
      },
      target_rpm: {
        variableName: 'target_rpm',
        displayName: 'Target rpm',
        type: 'int',
        default: 444,
      },
    }
    const result = heaterShakerSetTargetShakeSpeed(
      {
        moduleId: 'selected_module',
        rpm: 'target_rpm',
      },
      invariantContext,
      robotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'heaterShaker/setAndWaitForShakeSpeed',
          key: expect.any(String),
          params: {
            moduleId,
            rpm: 444,
          },
        },
      ],
      python: 'mock_heater_shaker_1.set_and_wait_for_shake_speed(target_rpm)',
    })
  })
  it('returns errors if moduleId and rpm are not valid runtime parameters', () => {
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
    const result = heaterShakerSetTargetShakeSpeed(
      {
        moduleId: 'mock_rtp',
        rpm: 'mock_string_rtp',
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
