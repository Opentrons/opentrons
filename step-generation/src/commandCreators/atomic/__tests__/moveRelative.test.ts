import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_PIPETTE,
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
})
