import { beforeEach, describe, expect, it } from 'vitest'

import { blowOutInPlace } from '../commandCreators/atomic/blowOutInPlace'
import {
  DEFAULT_PIPETTE,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../fixtures'

import type { BlowoutInPlaceParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../types'

describe('blowOutInPlace', () => {
  let invariantContext: InvariantContext
  let robotStateWithTip: RobotState

  const mockFlowRate = 10
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('blowOut in place', () => {
    const params: BlowoutInPlaceParams = {
      pipetteId: DEFAULT_PIPETTE,
      flowRate: mockFlowRate,
    }
    const result = blowOutInPlace(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'blowOutInPlace',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          flowRate: mockFlowRate,
        },
      },
    ])
    expect(res.python).toBe(
      `
mock_pipette.flow_rate.blow_out = 10
mock_pipette.blow_out()
`.trim()
    )
  })
})
