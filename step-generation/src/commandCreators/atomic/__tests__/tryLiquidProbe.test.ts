import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_PIPETTE,
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
  SOURCE_LABWARE,
} from '../../../fixtures'
import { tryLiquidProbe } from '../tryLiquidProbe'

import type { InvariantContext, RobotState } from '../../../types'

describe('tryLiquidProbe', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)
  })

  it('generates JSON and python', () => {
    const params = {
      pipetteId: DEFAULT_PIPETTE,
      labwareId: SOURCE_LABWARE,
      wellName: 'A1',
      wellLocation: {
        origin: 'top' as const,
        offset: { z: 2 },
      },
    }
    const result = tryLiquidProbe(params, invariantContext, robotState)
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'tryLiquidProbe',
          key: expect.any(String),
          params,
        },
      ],
      python: 'mock_pipette.detect_liquid_presence(mock_source_plate["A1"])',
    })
  })
})
