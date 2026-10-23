import { beforeEach, describe, expect, it } from 'vitest'

import { airGapInPlace } from '..'
import {
  getErrorResult,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'

import type { InvariantContext, RobotState } from '../../../types'

describe('airGapInPlace', () => {
  let robotStateWithTip: RobotState
  let invariantContext: InvariantContext
  const mockId = 'p300SingleId'
  const mockFlowRate = 20
  const mockVolume = 10
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('air gap in place', () => {
    const result = airGapInPlace(
      {
        pipetteId: mockId,
        flowRate: mockFlowRate,
        volume: mockVolume,
      },
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'airGapInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          volume: mockVolume,
          flowRate: mockFlowRate,
        },
      },
    ])
    expect(res.python).toBe(
      'mock_pipette.air_gap(volume=10, in_place=True, flow_rate=20)'
    )
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
      correction_volume: {
        variableName: 'correction_volume',
        displayName: 'Correction volume',
        type: 'float',
        default: 1,
      },
    }
    const result = airGapInPlace(
      {
        pipetteId: 'selected_pipette',
        volume: 'volume',
        flowRate: 'flow_rate',
        correctionVolume: 'correction_volume',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'airGapInPlace',
          key: expect.any(String),
          params: {
            pipetteId: mockId,
            volume: mockVolume,
            flowRate: mockFlowRate,
            correctionVolume: 1,
          },
        },
      ],
      python:
        'mock_pipette.air_gap(volume=volume, in_place=True, flow_rate=flow_rate)',
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
    const result = airGapInPlace(
      {
        pipetteId: 'mock_rtp',
        volume: 'mock_string_rtp',
        flowRate: 'mock_string_rtp',
        correctionVolume: 'mock_rtp',
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
    ])
  })
})
