import type { AspirateInPlaceParams } from '@opentrons/shared-data'
import { beforeEach, describe, expect, it } from 'vitest'
import { aspirateInPlace } from '../commandCreators/atomic'
import {
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../fixtures'
import type { InvariantContext, RobotState } from '../types'

describe('aspirateInPlace', () => {
  let invariantContext: InvariantContext
  let robotStateWithTip: RobotState

  const mockId = 'mockId'
  const mockFlowRate = 10
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
  })
})
