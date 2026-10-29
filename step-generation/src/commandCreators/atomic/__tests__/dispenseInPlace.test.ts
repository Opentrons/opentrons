import { beforeEach, describe, expect, it } from 'vitest'

import { dispenseInPlace } from '..'
import {
  getErrorResult,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'

import type { DispenseInPlaceParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

describe('dispenseInPlace', () => {
  let invariantContext: InvariantContext
  let robotStateWithTip: RobotState

  const mockId = 'p300SingleId'
  const mockFlowRate = 10
  const mockVolume = 10
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('dispense in place', () => {
    const params: DispenseInPlaceParams = {
      pipetteId: mockId,
      flowRate: mockFlowRate,
      volume: mockVolume,
    }
    const result = dispenseInPlace(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'dispenseInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          volume: mockVolume,
          flowRate: mockFlowRate,
        },
      },
    ])
    expect(res.python).toBe(`mock_pipette.dispense(volume=10, flow_rate=10)`)
  })
  it('resolves runtime parameters into the command and python', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: mockId,
      },
      volume: {
        variableName: 'volume',
        displayName: 'Volume',
        type: 'float',
        default: mockVolume,
      },
      flow_rate: {
        variableName: 'flow_rate',
        displayName: 'Flow rate',
        type: 'int',
        default: mockFlowRate,
      },
      push_out: {
        variableName: 'push_out',
        displayName: 'Push out',
        type: 'float',
        default: 2,
      },
      correction_volume: {
        variableName: 'correction_volume',
        displayName: 'Correction volume',
        type: 'float',
        default: 1,
      },
      is_air_gap: {
        variableName: 'is_air_gap',
        displayName: 'Is air gap',
        type: 'boolean',
        default: true,
      },
    }
    const result = dispenseInPlace(
      {
        pipetteId: 'selected_pipette',
        volume: 'volume',
        flowRate: 'flow_rate',
        pushOut: 'push_out',
        correctionVolume: 'correction_volume',
        isAirGap: 'is_air_gap',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'dispenseInPlace',
          key: expect.any(String),
          params: {
            pipetteId: mockId,
            volume: mockVolume,
            flowRate: mockFlowRate,
            pushOut: 2,
            correctionVolume: 1,
          },
          meta: { isAirGap: true },
        },
      ],
      python:
        'mock_pipette.dispense(volume=volume, flow_rate=flow_rate, push_out=push_out)',
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
    const result = dispenseInPlace(
      {
        pipetteId: 'mock_rtp',
        volume: 'mock_string_rtp',
        flowRate: 'mock_string_rtp',
        pushOut: 'mock_rtp',
        correctionVolume: 'mock_string_rtp',
        isAirGap: 'mock_string_rtp',
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
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
