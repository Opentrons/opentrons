// @flow
import {
  DEFAULT_PIPETTE,
  makeContext,
  getRobotStateWithTipStandard,
  getErrorResult,
  getSuccessResult,
} from '../__fixtures__'
import { moveToSlot } from '../commandCreators/atomic/moveToSlot'
import { expectTimelineError } from '../__utils__/testMatchers'

describe('moveToSlot', () => {
  let invariantContext
  let robotStateWithTip
  let params

  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)

    params = {
      pipette: DEFAULT_PIPETTE,
      slot: '1',
    }
  })
  it('should return a moveToSlot command without optional params', () => {
    const result = moveToSlot(params, invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        command: 'moveToSlot',
        params,
      },
    ])
  })
  it('should return a moveToSlot command with optional params', () => {
    const optionalParams = {
      offset: {
        x: 1,
        y: 2,
        z: 3,
      },
      minimumZHeight: 1,
      forceDirect: true,
    }
    const combinedParams = {
      ...params,
      ...optionalParams,
    }
    const result = moveToSlot(
      combinedParams,
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        command: 'moveToSlot',
        params: combinedParams,
      },
    ])
  })
  it('should return an invalid slot error when attempting to move to an invalid slot', () => {
    const result = moveToSlot(
      {
        ...params,
        slot: 'whack slot',
      },
      invariantContext,
      robotStateWithTip
    )
    expectTimelineError(getErrorResult(result).errors, 'INVALID_SLOT')
  })
  it('should return an invalid pipette error when using an invalid pipette', () => {
    const result = moveToSlot(
      {
        ...params,
        pipette: 'badPipette',
      },
      invariantContext,
      robotStateWithTip
    )

    expectTimelineError(getErrorResult(result).errors, 'PIPETTE_DOES_NOT_EXIST')
  })
})
