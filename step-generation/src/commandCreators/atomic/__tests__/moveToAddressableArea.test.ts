import { describe, expect, it } from 'vitest'

import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'

import { moveToAddressableArea } from '..'
import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'

import type { CutoutId } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

const mockCutout = 'cutoutA3' as CutoutId
const mockTrashId = 'mockTrashId'
let invariantContext: InvariantContext = {
  ...makeContext(),
  trashBinEntities: {
    [mockTrashId]: {
      id: mockTrashId,
      pythonName: 'mock_trash_bin_1',
      location: mockCutout,
    },
  },
}
const prevRobotState: RobotState =
  getInitialRobotStateStandard(invariantContext)

describe('moveToAddressableArea', () => {
  it('should call moveToAddressableArea with correct params for trash bin', () => {
    const result = moveToAddressableArea(
      {
        pipetteId: DEFAULT_PIPETTE,
        fixtureId: mockTrashId,
        offset: { x: 0, y: 0, z: 1 },
      },
      invariantContext,
      prevRobotState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'moveToAddressableArea',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          addressableAreaName: 'movableTrashA3',
          offset: { x: 0, y: 0, z: 1 },
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      'mock_pipette.move_to(mock_trash_bin_1)'
    )
  })
  it('should call moveToAddressableArea with correct params for waste chute', () => {
    const wasteChuteId = 'wasteChuteId'
    invariantContext = {
      ...invariantContext,
      wasteChuteEntities: {
        [wasteChuteId]: {
          id: wasteChuteId,
          pythonName: 'mock_waste_chute_1',
          location: WASTE_CHUTE_CUTOUT,
        },
      },
    }
    const result = moveToAddressableArea(
      {
        pipetteId: DEFAULT_PIPETTE,
        fixtureId: wasteChuteId,
        offset: { x: 0, y: 0, z: 1 },
      },
      invariantContext,
      prevRobotState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'moveToAddressableArea',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          addressableAreaName: '1ChannelWasteChute',
          offset: { x: 0, y: 0, z: 1 },
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      'mock_pipette.move_to(mock_waste_chute_1)'
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
      selected_fixture: {
        variableName: 'selected_fixture',
        displayName: 'Selected fixture',
        type: 'string',
        default: mockTrashId,
      },
      offset_x: {
        variableName: 'offset_x',
        displayName: 'Offset x',
        type: 'int',
        default: 0,
      },
      offset_y: {
        variableName: 'offset_y',
        displayName: 'Offset y',
        type: 'int',
        default: 0,
      },
      offset_z: {
        variableName: 'offset_z',
        displayName: 'Offset z',
        type: 'int',
        default: 1,
      },
    }
    const result = moveToAddressableArea(
      {
        pipetteId: 'selected_pipette',
        fixtureId: 'selected_fixture',
        offset: { x: 'offset_x', y: 'offset_y', z: 'offset_z' },
      },
      invariantContext,
      prevRobotState
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'moveToAddressableArea',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            addressableAreaName: 'movableTrashA3',
            offset: { x: 0, y: 0, z: 1 },
          },
        },
      ],
      python: 'mock_pipette.move_to(mock_trash_bin_1)',
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
    const result = moveToAddressableArea(
      {
        pipetteId: 'mock_rtp',
        fixtureId: 'mock_rtp',
        offset: { x: 'mock_string_rtp', y: 'mock_rtp', z: 'mock_string_rtp' },
      },
      invariantContext,
      prevRobotState
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
    ])
  })
})
