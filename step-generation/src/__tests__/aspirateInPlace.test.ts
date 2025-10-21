import { beforeEach, describe, expect, it } from 'vitest'

import { aspirateInPlace } from '../commandCreators/atomic'
import {
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../fixtures'

import type { AspirateInPlaceParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../types'

describe('aspirateInPlace', () => {
  let robotStateWithTip: RobotState
  let invariantContext: InvariantContext
  const mockId = 'p300SingleId'
  const mockFlowRate = 20
  const mockVolume = 10
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('aspirate in place', () => {
    const params: AspirateInPlaceParams = {
      pipetteId: mockId,
      flowRate: mockFlowRate,
      volume: mockVolume,
    }
    const result = aspirateInPlace(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'aspirateInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          volume: mockVolume,
          flowRate: mockFlowRate,
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `mock_pipette.aspirate(volume=10, flow_rate=20)`
    )
  })
})
