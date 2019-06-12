// @flow
import getNextRobotStateAndWarnings from '../getNextRobotStateAndWarnings'
import forAspirateDispense from '../getNextRobotStateAndWarnings/forAspirateDispense'
import {
  makeContext,
  getRobotStateWithTipStandard,
  getSuccessResult,
} from './fixtures'

import aspirate from '../commandCreators/atomic/aspirate'

jest.mock('../getNextRobotStateAndWarnings/forAspirateDispense')

let invariantContext
let robotStateWithTip
beforeEach(() => {
  invariantContext = makeContext()
  robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
})

describe('Aspirate Command', () => {
  test('aspirate from single-ingredient well', () => {
    const args = {
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1',
      volume: 152,
      flowRate: 2.22,
      offsetFromBottomMm: 1.11,
    }
    const result = aspirate(args)(invariantContext, robotStateWithTip)
    const res = getSuccessResult(result)
    const command = res.commands[0]
    getNextRobotStateAndWarnings(command, invariantContext, robotStateWithTip)

    expect(forAspirateDispense).toHaveBeenCalledWith(
      command.params,
      invariantContext,
      robotStateWithTip
    )
  })
})
