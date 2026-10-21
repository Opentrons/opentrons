import { describe, expect, it } from 'vitest'

import { moveToAddressableAreaForDropTip } from '..'
import { getErrorResult, getSuccessResult } from '../../../fixtures'

const getRobotInitialState = (): any => {
  return {}
}
const mockId = 'mockId'
const invariantContext: any = {
  pipetteEntities: {
    [mockId]: {
      name: 'p50_single_flex',
      id: mockId,
    },
  },
}

describe('moveToAddressableAreaForDropTip', () => {
  it('should call moveToAddressableAreaForDropTip with correct params', () => {
    const robotInitialState = getRobotInitialState()
    const mockName = 'movableTrashA3'
    const result = moveToAddressableAreaForDropTip(
      { pipetteId: mockId, addressableAreaName: mockName },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'moveToAddressableAreaForDropTip',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          addressableAreaName: mockName,
          offset: { x: 0, y: 0, z: 0 },
          alternateDropLocation: true,
        },
      },
    ])
  })
  it('resolves pipetteId and addressableAreaName when they are string runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: mockId,
      },
      area_name: {
        variableName: 'area_name',
        displayName: 'Area name',
        type: 'string',
        default: 'movableTrashA3',
      },
    }
    const result = moveToAddressableAreaForDropTip(
      { pipetteId: 'selected_pipette', addressableAreaName: 'area_name' },
      invariantContext,
      getRobotInitialState()
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'moveToAddressableAreaForDropTip',
          key: expect.any(String),
          params: {
            pipetteId: mockId,
            addressableAreaName: 'movableTrashA3',
            offset: { x: 0, y: 0, z: 0 },
            alternateDropLocation: true,
          },
        },
      ],
    })
  })
  it('returns errors if pipetteId and addressableAreaName are not string runtime parameters', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
    }
    const result = moveToAddressableAreaForDropTip(
      { pipetteId: 'mock_rtp', addressableAreaName: 'mock_rtp' },
      invariantContext,
      getRobotInitialState()
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
