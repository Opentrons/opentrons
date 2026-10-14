import { beforeEach, describe, expect, it } from 'vitest'

import { makeImmutableStateUpdater } from '../../__utils__'
import { E1_NOZZLE, H1_NOZZLE, QUADRANT } from '@opentrons/shared-data'
import {
  getInitialRobotStateStandard,
  makeContext,
} from '../../fixtures'
import { forConfigureNozzleLayout as _forConfigureNozzleLayout } from '../forConfigureNozzleLayout'

import type { InvariantContext, RobotState } from '../../types'

const forConfigureNozzleLayout = makeImmutableStateUpdater(
  _forConfigureNozzleLayout
)

const PIPETTE_ID = 'p300MultiId'

describe('forConfigureNozzleLayout', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)
  })

  it('persists QUADRANT style and backLeftNozzle for partial-column configs', () => {
    const result = forConfigureNozzleLayout(
      {
        pipetteId: PIPETTE_ID,
        configurationParams: {
          style: QUADRANT,
          primaryNozzle: H1_NOZZLE,
          backLeftNozzle: E1_NOZZLE,
        },
      },
      invariantContext,
      robotState
    )

    expect(result.robotState.pipettes[PIPETTE_ID].nozzles).toBe(QUADRANT)
    expect(result.robotState.pipettes[PIPETTE_ID].primaryNozzle).toBe(H1_NOZZLE)
    expect(result.robotState.pipettes[PIPETTE_ID].backLeftNozzle).toBe(
      E1_NOZZLE
    )
  })
})
