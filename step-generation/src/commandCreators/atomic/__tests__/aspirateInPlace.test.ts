import { beforeEach, describe, expect, it } from 'vitest'

import { aspirateInPlace } from '..'
import {
  getErrorResult,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'

import type { AspirateInPlaceParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

describe('aspirateInPlace', () => {
  let robotStateWithTip: RobotState
  let invariantContext: InvariantContext
  const mockId = 'p300SingleId'
  const mockFlowRate = 20
  const mockVolume = 10
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('aspirate in place', () => {
    const params: AspirateInPlaceParams = {
      pipetteId: mockId,
      flowRate: mockFlowRate,
      volume: mockVolume,
    }
    const result = aspirateInPlace(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'aspirateInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          volume: mockVolume,
          flowRate: mockFlowRate,
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `mock_pipette.aspirate(volume=10, flow_rate=20)`
    )
  })

  it('resolves pipetteId when it is a string runtime parameter', () => {
    invariantContext = {
      ...invariantContext,
      runtimeParameters: {
        selected_pipette: {
          variableName: 'selected_pipette',
          displayName: 'Selected pipette',
          type: 'string',
          default: mockId,
        },
      },
    }
    const result = aspirateInPlace(
      {
        pipetteId: 'selected_pipette',
        volume: mockVolume,
        flowRate: mockFlowRate,
      },
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'aspirateInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          volume: mockVolume,
          flowRate: mockFlowRate,
        },
      },
    ])
    expect(res.python).toBe(
      `mock_pipette.aspirate(volume=${mockVolume}, flow_rate=${mockFlowRate})`
    )
  })

  it('resolves pipette, volume, flow rate, and correction volume when all are runtime parameters', () => {
    invariantContext = {
      ...invariantContext,
      runtimeParameters: {
        selected_pipette: {
          variableName: 'selected_pipette',
          displayName: 'Selected pipette',
          type: 'string',
          default: mockId,
        },
        sample_volume: {
          variableName: 'sample_volume',
          displayName: 'Sample volume',
          type: 'float',
          default: 15,
        },
        aspirate_flow_rate: {
          variableName: 'aspirate_flow_rate',
          displayName: 'Aspirate flow rate',
          type: 'int',
          default: 25,
        },
        volume_correction: {
          variableName: 'volume_correction',
          displayName: 'Volume correction',
          type: 'float',
          default: 1.5,
        },
      },
    }
    const result = aspirateInPlace(
      {
        pipetteId: 'selected_pipette',
        volume: 'sample_volume',
        flowRate: 'aspirate_flow_rate',
        correctionVolume: 'volume_correction',
      },
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'aspirateInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          volume: 15,
          flowRate: 25,
          correctionVolume: 1.5,
        },
      },
    ])
    expect(res.python).toBe(
      `mock_pipette.aspirate(volume=sample_volume, flow_rate=aspirate_flow_rate)`
    )
  })

  it('errors when a string arg is not a numeric runtime parameter', () => {
    invariantContext = {
      ...invariantContext,
      runtimeParameters: {
        mock_rtp: {
          variableName: 'mock_rtp',
          displayName: 'mock rtp',
          type: 'boolean',
          default: false,
        },
      },
    }
    const result = aspirateInPlace(
      {
        pipetteId: mockId,
        volume: 'missing_volume',
        flowRate: 'mock_rtp',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "missing_volume" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
