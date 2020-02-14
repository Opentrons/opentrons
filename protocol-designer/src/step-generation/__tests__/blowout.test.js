// @flow
import { expectTimelineError } from './utils/testMatchers'
import { blowout } from '../commandCreators/atomic/blowout'
import {
  makeContext,
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  getErrorResult,
  getSuccessResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from './fixtures'

describe('blowout', () => {
  let invariantContext
  let initialRobotState
  let robotStateWithTip
  let params

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)

    params = {
      pipette: DEFAULT_PIPETTE,
      labware: SOURCE_LABWARE,
      well: 'A1',
      flowRate: 21.1,
      offsetFromBottomMm: 1.3,
    }
  })

  test('blowout with tip', () => {
    const result = blowout(params, invariantContext, robotStateWithTip)

    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        command: 'blowout',
        params,
      },
    ])
  })

  test('blowout with invalid pipette ID should throw error', () => {
    const result = blowout(
      {
        ...params,
        pipette: 'badPipette',
      },
      invariantContext,
      robotStateWithTip
    )

    expectTimelineError(getErrorResult(result).errors, 'PIPETTE_DOES_NOT_EXIST')
  })

  test('blowout with invalid labware ID should throw error', () => {
    const result = blowout(
      {
        ...params,
        labware: 'badLabware',
      },
      invariantContext,
      robotStateWithTip
    )

    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })

  test('blowout with no tip should throw error', () => {
    const result = blowout(params, invariantContext, initialRobotState)

    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'NO_TIP_ON_PIPETTE',
    })
  })
})
