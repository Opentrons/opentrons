import type { BlowoutInPlaceParams } from '@opentrons/shared-data'
import { beforeEach, describe, expect, it } from 'vitest'
import { blowOutInPlace } from '../commandCreators/atomic/blowOutInPlace'
import {
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../fixtures'
import type { InvariantContext, RobotState } from '../types'

describe('blowOutInPlace', () => {
  let invariantContext: InvariantContext
  let robotStateWithTip: RobotState

  const mockId = 'mockId'
  const mockFlowRate = 10
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  it('blowOut in place', () => {
    const params: BlowoutInPlaceParams = {
      pipetteId: mockId,
      flowRate: mockFlowRate,
    }
    const result = blowOutInPlace(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'blowOutInPlace',
        key: expect.any(String),
        params: {
          pipetteId: mockId,
          flowRate: mockFlowRate,
        },
      },
    ])
  })
})
