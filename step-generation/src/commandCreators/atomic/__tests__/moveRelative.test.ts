import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'
import { moveRelative } from '../moveRelative'

import type { InvariantContext, RobotState } from '../../../types'

describe('moveRelative', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)
  })

  it('generates JSON and python for a relative move', () => {
    const result = moveRelative(
      { pipetteId: DEFAULT_PIPETTE, axis: 'z', distance: -2.5 },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'moveRelative',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            axis: 'z',
            distance: -2.5,
          },
        },
      ],
      python: 'mock_pipette.move_axes_relative(axis="z", distance=-2.5)',
    })
  })
  it('resolves pipetteId, axis, and distance when they are runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: DEFAULT_PIPETTE,
      },
      move_axis: {
        variableName: 'move_axis',
        displayName: 'Move axis',
        type: 'string',
        default: 'z',
      },
      move_distance: {
        variableName: 'move_distance',
        displayName: 'Move distance',
        type: 'float',
        default: -2.5,
      },
    }
    const result = moveRelative(
      {
        pipetteId: 'selected_pipette',
        axis: 'move_axis',
        distance: 'move_distance',
      },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'moveRelative',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            axis: 'z',
            distance: -2.5,
          },
        },
      ],
      python:
        'mock_pipette.move_axes_relative(axis=move_axis, distance=move_distance)',
    })
  })
  it('returns errors if pipetteId, axis, and distance are not valid runtime parameters', () => {
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
    const result = moveRelative(
      {
        pipetteId: 'mock_bool_rtp',
        axis: 'mock_int_rtp',
        distance: 'mock_string_rtp',
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
        message: 'Runtime parameter "mock_int_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
