import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'
import { blowOutInPlace } from '../blowOutInPlace'

import type { BlowoutInPlaceParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

describe('blowOutInPlace', () => {
  let invariantContext: InvariantContext
  let robotStateWithTip: RobotState

  const mockFlowRate = 10
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('blowOut in place', () => {
    const params: BlowoutInPlaceParams = {
      pipetteId: DEFAULT_PIPETTE,
      flowRate: mockFlowRate,
    }
    const result = blowOutInPlace(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'blowOutInPlace',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          flowRate: mockFlowRate,
        },
      },
    ])
    expect(res.python).toBe(
      `
mock_pipette.flow_rate.blow_out = 10
mock_pipette.blow_out()
`.trim()
    )
  })
  it('resolves runtime parameters into the command and python', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: DEFAULT_PIPETTE,
      },
      flow_rate: {
        variableName: 'flow_rate',
        displayName: 'Flow rate',
        type: 'int',
        default: mockFlowRate,
      },
    }
    const result = blowOutInPlace(
      {
        pipetteId: 'selected_pipette',
        flowRate: 'flow_rate',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'blowOutInPlace',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            flowRate: mockFlowRate,
          },
        },
      ],
      python: `
mock_pipette.flow_rate.blow_out = flow_rate
mock_pipette.blow_out()
`.trim(),
    })
  })
  it('returns errors if runtime parameters are not valid', () => {
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
    const result = blowOutInPlace(
      {
        pipetteId: 'mock_rtp',
        flowRate: 'mock_string_rtp',
      },
      invariantContext,
      robotStateWithTip
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
