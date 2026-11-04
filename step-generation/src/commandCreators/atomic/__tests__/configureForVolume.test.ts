import { describe, expect, it } from 'vitest'

import { getErrorResult, getSuccessResult } from '../../../fixtures'
import { configureForVolume } from '../configureForVolume'

const getRobotInitialState = (): any => {
  return {}
}
const mockId = 'mockId'
const invariantContext: any = {
  pipetteEntities: {
    [mockId]: {
      name: 'p50_single_flex',
      id: mockId,
      pythonName: 'mock_pipette_left',
    },
  },
  runtimeParameters: {},
}

describe('configureForVolume', () => {
  it('should call configureForVolume with correct params', () => {
    const robotInitialState = getRobotInitialState()
    const mockId = 'mockId'
    const result = configureForVolume(
      { pipetteId: mockId, volume: 1 },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'configureForVolume',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          volume: 1,
        },
      },
    ])
    expect(res.python).toBe('mock_pipette_left.configure_for_volume(1)')
  })
  it('resolves all args when they are runtime parameters', () => {
    invariantContext.runtimeParameters = {
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
        default: 1,
      },
    }
    const robotInitialState = getRobotInitialState()
    const result = configureForVolume(
      { pipetteId: 'selected_pipette', volume: 'sample_volume' },
      invariantContext,
      robotInitialState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'configureForVolume',
          key: expect.any(String),
          params: {
            pipetteId: mockId,
            volume: 1,
          },
        },
      ],
      python: 'mock_pipette_left.configure_for_volume(sample_volume)',
    })
  })
  it('returns errors if runtime parameters are missing or invalid', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
    }
    const robotInitialState = getRobotInitialState()
    const result = configureForVolume(
      { pipetteId: 'mock_rtp', volume: 'missing_volume' },
      invariantContext,
      robotInitialState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "missing_volume" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
