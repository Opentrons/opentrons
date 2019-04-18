// @flow
import { expectTimelineError } from './testMatchers'
import _touchTip from '../commandCreators/atomic/touchTip'
import {
  makeContext,
  makeState,
  commandCreatorNoErrors,
  commandCreatorHasErrors,
} from './fixtures'

const touchTip = commandCreatorNoErrors(_touchTip)
const touchTipWithErrors = commandCreatorHasErrors(_touchTip)

describe('touchTip', () => {
  let invariantContext
  let initialRobotState
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
    initialRobotState = makeState({
      ...makeStateArgs,
      tiprackSetting: { tiprack1Id: true },
    })
    robotStateWithTip = makeState({
      ...makeStateArgs,
      tiprackSetting: { tiprack1Id: false },
    })
    robotStateWithTip.tipState.pipettes.p300SingleId = true
  })

  test('touchTip with tip', () => {
    const result = touchTip({
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expect(result.commands).toEqual([
      {
        command: 'touch-tip',
        params: {
          pipette: 'p300SingleId',
          labware: 'sourcePlateId',
          well: 'A1',
        },
      },
    ])

    expect(result.robotState).toEqual(robotStateWithTip)
  })

  test('touchTip with tip, specifying offsetFromBottomMm', () => {
    const result = touchTip({
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1',
      offsetFromBottomMm: 10,
    })(invariantContext, robotStateWithTip)

    expect(result.commands).toEqual([
      {
        command: 'touch-tip',
        params: {
          pipette: 'p300SingleId',
          labware: 'sourcePlateId',
          well: 'A1',
          offsetFromBottomMm: 10,
        },
      },
    ])

    expect(result.robotState).toEqual(robotStateWithTip)
  })

  test('touchTip with invalid pipette ID should throw error', () => {
    const result = touchTipWithErrors({
      pipette: 'badPipette',
      labware: 'sourcePlateId',
      well: 'A1',
    })(invariantContext, robotStateWithTip)

    expectTimelineError(result.errors, 'PIPETTE_DOES_NOT_EXIST')
  })

  test('touchTip with no tip should throw error', () => {
    const result = touchTipWithErrors({
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1',
    })(invariantContext, initialRobotState)

    expect(result.errors).toEqual([
      {
        message:
          "Attempted to touchTip with no tip on pipette: p300SingleId from sourcePlateId's well A1",
        type: 'NO_TIP_ON_PIPETTE',
      },
    ])
  })
})
