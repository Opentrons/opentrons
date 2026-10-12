import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'
import { moveToCoordinates } from '../moveToCoordinates'

import type { InvariantContext, RobotState } from '../../../types'

describe('moveToCoordinates', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)
  })

  it('generates JSON and python with required params only', () => {
    const result = moveToCoordinates(
      {
        pipetteId: DEFAULT_PIPETTE,
        coordinates: { x: 100, y: 200, z: 50 },
      },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'moveToCoordinates',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            coordinates: { x: 100, y: 200, z: 50 },
          },
        },
      ],
      python: 'mock_pipette.move_axes_to(coordinates=(100, 200, 50))',
    })
  })

  it('generates JSON and python with optional movement params', () => {
    const result = moveToCoordinates(
      {
        pipetteId: DEFAULT_PIPETTE,
        coordinates: { x: 1, y: 2, z: 3 },
        forceDirect: true,
        minimumZHeight: 42,
      },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'moveToCoordinates',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            coordinates: { x: 1, y: 2, z: 3 },
            forceDirect: true,
            minimumZHeight: 42,
          },
        },
      ],
      python:
        'mock_pipette.move_axes_to(coordinates=(1, 2, 3), force_direct=True, minimum_z_height=42)',
    })
  })
  it('resolves pipetteId, coordinates, forceDirect, and minimumZHeight when they are runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: DEFAULT_PIPETTE,
      },
      coord_x: {
        variableName: 'coord_x',
        displayName: 'Coord x',
        type: 'float',
        default: 100,
      },
      coord_y: {
        variableName: 'coord_y',
        displayName: 'Coord y',
        type: 'int',
        default: 200,
      },
      coord_z: {
        variableName: 'coord_z',
        displayName: 'Coord z',
        type: 'float',
        default: 50,
      },
      force_direct: {
        variableName: 'force_direct',
        displayName: 'Force direct',
        type: 'boolean',
        default: false,
      },
      min_z: {
        variableName: 'min_z',
        displayName: 'Min z',
        type: 'float',
        default: 42,
      },
    }
    const result = moveToCoordinates(
      {
        pipetteId: 'selected_pipette',
        coordinates: { x: 'coord_x', y: 'coord_y', z: 'coord_z' },
        forceDirect: 'force_direct',
        minimumZHeight: 'min_z',
      },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'moveToCoordinates',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            coordinates: { x: 100, y: 200, z: 50 },
            forceDirect: false,
            minimumZHeight: 42,
          },
        },
      ],
      python:
        'mock_pipette.move_axes_to(coordinates=(coord_x, coord_y, coord_z), force_direct=force_direct, minimum_z_height=min_z)',
    })
  })
  it('returns errors if pipetteId, coordinates, forceDirect, and minimumZHeight are not valid runtime parameters', () => {
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
    const result = moveToCoordinates(
      {
        pipetteId: 'mock_bool_rtp',
        coordinates: {
          x: 'mock_string_rtp',
          y: 'missing_coord',
          z: 'mock_bool_rtp',
        },
        forceDirect: 'mock_int_rtp',
        minimumZHeight: 'mock_string_rtp',
      },
      invariantContext,
      robotState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_bool_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "missing_coord" is missing',
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
