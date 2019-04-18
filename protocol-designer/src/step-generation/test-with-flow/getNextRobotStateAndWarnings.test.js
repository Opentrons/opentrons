// @flow
import getNextRobotStateAndWarnings from '../getNextRobotStateAndWarnings'
import forAspirateDispense from '../getNextRobotStateAndWarnings/forAspirateDispense'
import { makeContext, makeState, commandCreatorNoErrors } from './fixtures'

import _aspirate from '../commandCreators/atomic/aspirate'

const aspirate = commandCreatorNoErrors(_aspirate)

jest.mock('../getNextRobotStateAndWarnings/forAspirateDispense')

let invariantContext
let robotStateWithTip
beforeEach(() => {
  // TODO IMMEDIATELY this invariantContext/initialRobotState/robotStateWithTip is repeated in aspirate.test.js -- make a fixture helper?
  invariantContext = makeContext()
  const makeStateArgs = {
    invariantContext,
    pipetteLocations: { p300SingleId: { mount: 'left' } },
    labwareLocations: {
      tiprack1Id: { slot: '1' },
      sourcePlateId: { slot: '2' },
    },
  }
  robotStateWithTip = makeState({
    ...makeStateArgs,
    tiprackSetting: { tiprack1Id: false },
  })
  robotStateWithTip.tipState.pipettes.p300SingleId = true
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
