import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { pickUpTip } from '../commandCreators/atomic'
import {
  DEFAULT_PIPETTE,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
  TIPRACK_1,
} from '../fixtures'

import type { InvariantContext, RobotState } from '../types'

describe('pickUpTip', () => {
  let robotStateWithTip: RobotState
  let invariantContext: InvariantContext
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('pick up tip', () => {
    const params = {
      pipetteId: DEFAULT_PIPETTE,
      labwareId: TIPRACK_1,
      wellName: 'B1',
    }
    const result = pickUpTip(params, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'pickUpTip',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          labwareId: TIPRACK_1,
          wellName: 'B1',
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `mock_pipette.pick_up_tip(location=mock_tip_rack_1)`
    )
  })
})
