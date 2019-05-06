// @flow
import getNextRobotStateAndWarnings from '../getNextRobotStateAndWarnings'
import forAspirateDispense from '../getNextRobotStateAndWarnings/forAspirateDispense'
import {
  makeContext,
  getRobotStateWithTipStandard,
  commandCreatorNoErrors,
} from './fixtures'

import _aspirate from '../commandCreators/atomic/aspirate'

const aspirate = commandCreatorNoErrors(_aspirate)

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
    }
    const command = aspirate(args)(invariantContext, robotStateWithTip)
      .commands[0]
    getNextRobotStateAndWarnings(command, invariantContext, robotStateWithTip)

    expect(forAspirateDispense).toHaveBeenCalledWith(
      command.params,
      invariantContext,
      robotStateWithTip
    )
  })
})
