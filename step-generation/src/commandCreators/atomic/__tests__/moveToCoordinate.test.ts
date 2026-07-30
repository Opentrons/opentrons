import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_PIPETTE,
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
})
