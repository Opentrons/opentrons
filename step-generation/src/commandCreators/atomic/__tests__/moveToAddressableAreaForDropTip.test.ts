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
  runtimeParameters: {},
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
  it('resolves every arg when they are runtime parameters', () => {
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
      offset_x: {
        variableName: 'offset_x',
        displayName: 'Offset x',
        type: 'float',
        default: 1,
      },
      offset_y: {
        variableName: 'offset_y',
        displayName: 'Offset y',
        type: 'int',
        default: 2,
      },
      offset_z: {
        variableName: 'offset_z',
        displayName: 'Offset z',
        type: 'float',
        default: 3,
      },
      alternate_drop: {
        variableName: 'alternate_drop',
        displayName: 'Alternate drop',
        type: 'boolean',
        default: false,
      },
      move_speed: {
        variableName: 'move_speed',
        displayName: 'Move speed',
        type: 'float',
        default: 100,
      },
      min_z: {
        variableName: 'min_z',
        displayName: 'Min z',
        type: 'float',
        default: 42,
      },
      force_direct: {
        variableName: 'force_direct',
        displayName: 'Force direct',
        type: 'boolean',
        default: false,
      },
      ignore_tips: {
        variableName: 'ignore_tips',
        displayName: 'Ignore tips',
        type: 'boolean',
        default: true,
      },
    }
    const result = moveToAddressableAreaForDropTip(
      {
        pipetteId: 'selected_pipette',
        addressableAreaName: 'area_name',
        offset: { x: 'offset_x', y: 'offset_y', z: 'offset_z' },
        alternateDropLocation: 'alternate_drop',
        speed: 'move_speed',
        minimumZHeight: 'min_z',
        forceDirect: 'force_direct',
        ignoreTipConfiguration: 'ignore_tips',
      },
      invariantContext,
      getRobotInitialState()
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'moveToAddressableAreaForDropTip',
          key: expect.any(String),
          params: {
            pipetteId: mockId,
            addressableAreaName: 'movableTrashA3',
            offset: { x: 1, y: 2, z: 3 },
            alternateDropLocation: false,
            speed: 100,
            minimumZHeight: 42,
            forceDirect: false,
            ignoreTipConfiguration: true,
          },
        },
      ],
    })
  })
  it('returns errors if args are not valid runtime parameters', () => {
    invariantContext.runtimeParameters = {
      mock_bool_rtp: {
        variableName: 'mock_bool_rtp',
        displayName: 'mock bool rtp',
        type: 'boolean',
        default: false,
      },
      mock_int_rtp: {
        variableName: 'mock_int_rtp',
        displayName: 'mock int rtp',
        type: 'int',
        default: 1,
      },
      mock_string_rtp: {
        variableName: 'mock_string_rtp',
        displayName: 'mock string rtp',
        type: 'string',
        default: 'mock',
      },
    }
    const result = moveToAddressableAreaForDropTip(
      {
        pipetteId: 'mock_bool_rtp',
        addressableAreaName: 'mock_int_rtp',
        offset: {
          x: 'mock_string_rtp',
          y: 'missing_offset',
          z: 'mock_bool_rtp',
        },
        alternateDropLocation: 'mock_int_rtp',
        speed: 'mock_string_rtp',
        minimumZHeight: 'mock_bool_rtp',
        forceDirect: 'mock_string_rtp',
        ignoreTipConfiguration: 'mock_int_rtp',
      },
      invariantContext,
      getRobotInitialState()
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_bool_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_int_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "missing_offset" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_bool_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_int_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_bool_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_int_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
