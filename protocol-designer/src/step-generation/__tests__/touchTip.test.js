// @flow
import { expectTimelineError } from './testMatchers'
import { touchTip } from '../commandCreators/atomic/touchTip'
import {
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from './fixtures'

describe('touchTip', () => {
  let invariantContext
  let initialRobotState
  let robotStateWithTip

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })

  test('touchTip with tip, specifying offsetFromBottomMm', () => {
    const result = touchTip(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
        offsetFromBottomMm: 10,
      },
      invariantContext,
      robotStateWithTip
    )
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      {
        command: 'touchTip',
        params: {
          pipette: DEFAULT_PIPETTE,
          labware: SOURCE_LABWARE,
          well: 'A1',
          offsetFromBottomMm: 10,
        },
      },
    ])
  })

  test('touchTip with invalid pipette ID should throw error', () => {
    const result = touchTip(
      {
        pipette: 'badPipette',
        labware: SOURCE_LABWARE,
        well: 'A1',
        offsetFromBottomMm: 10,
      },
      invariantContext,
      robotStateWithTip
    )
    const res = getErrorResult(result)

    expectTimelineError(res.errors, 'PIPETTE_DOES_NOT_EXIST')
  })

  test('touchTip with no tip should throw error', () => {
    const result = touchTip(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
        offsetFromBottomMm: 10,
      },
      invariantContext,
      initialRobotState
    )
    const res = getErrorResult(result)

    expect(res.errors).toEqual([
      {
        message:
          "Attempted to touchTip with no tip on pipette: p300SingleId from sourcePlateId's well A1",
        type: 'NO_TIP_ON_PIPETTE',
      },
    ])
  })
})
