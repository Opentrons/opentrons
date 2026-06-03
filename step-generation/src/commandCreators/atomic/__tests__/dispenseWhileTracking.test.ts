import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_PIPETTE,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
  SOURCE_LABWARE,
} from '../../../fixtures'
import { dispenseWhileTracking } from '../dispenseWhileTracking'

import type { AspDispWhileTrackingParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

const trackingParams: AspDispWhileTrackingParams = {
  pipetteId: DEFAULT_PIPETTE,
  labwareId: SOURCE_LABWARE,
  wellName: 'A1',
  volume: 50,
  flowRate: 6,
  trackFromLocation: {
    origin: 'bottom',
    offset: { z: 5 },
  },
  trackToLocation: {
    origin: 'top',
    offset: { z: 10 },
  },
}

describe('dispenseWhileTracking', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)
  })

  it('generates JSON and python', () => {
    const result = dispenseWhileTracking(
      trackingParams,
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'dispenseWhileTracking',
        key: expect.any(String),
        params: trackingParams,
      },
    ])

    expect(getSuccessResult(result).python).toBe(
      `
mock_pipette.dispense(
    volume=50,
    location=mock_source_plate["A1"].bottom(z=5),
    flow_rate=6,
    end_location=mock_source_plate["A1"].top(z=10),
)`.trimStart()
    )
  })
})
