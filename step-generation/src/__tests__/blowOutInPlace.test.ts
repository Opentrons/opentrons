import { blowOutInPlace } from '../commandCreators/atomic/blowOutInPlace'
import {
  makeContext,
  getRobotStateWithTipStandard,
  getSuccessResult,
} from '../fixtures'
import type { RobotState, InvariantContext } from '../types'
import type { BlowOutInPlaceArgs } from '../commandCreators/atomic/blowOutInPlace'

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
    const params: BlowOutInPlaceArgs = {
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
