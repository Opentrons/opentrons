// @flow
import type { RobotState } from '../types'
import { makeContext, makeState, commandCreatorNoErrors } from './fixtures'
import _dropAllTips from '../commandCreators/atomic/dropAllTips'

const dropAllTips = commandCreatorNoErrors(_dropAllTips)

const p300SingleId = 'p300SingleId'
const p300MultiId = 'p300MultiId'

let initialRobotState
let invariantContext

beforeEach(() => {
  // TODO IMMEDIATELY this invariantContext/initialRobotState/robotStateWithTip is repeated in aspirate.test.js -- make a fixture helper?
  invariantContext = makeContext()
  const makeStateArgs = {
    invariantContext,
    pipetteLocations: {
      p300SingleId: { mount: 'left' },
      p300MultiId: { mount: 'right' },
    },
    labwareLocations: {
      tiprack1Id: { slot: '1' },
      sourcePlateId: { slot: '2' },
    },
  }
  initialRobotState = makeState({
    ...makeStateArgs,
    tiprackSetting: { tiprack1Id: true },
  })
})

function expectNoTipsRemaining(robotState: RobotState) {
  const pipetteIds = Object.keys(robotState.tipState.pipettes)
  pipetteIds.forEach(pipetteId => {
    expect(robotState.tipState.pipettes[pipetteId]).toBe(false)
  })
}

describe('drop all tips', () => {
  test('should do nothing with no pipettes', () => {
    initialRobotState.pipettes = {}
    initialRobotState.tipState.pipettes = {}

    const result = dropAllTips()(invariantContext, initialRobotState)
    expect(result.commands).toHaveLength(0)
    expectNoTipsRemaining(result.robotState)
  })

  test('should do nothing with pipette that does not have tips', () => {
    const result = dropAllTips()(invariantContext, initialRobotState)
    expect(result.commands).toHaveLength(0)
    expectNoTipsRemaining(result.robotState)
  })

  test('should drop tips of one pipette that has them, and not one without', () => {
    initialRobotState.tipState.pipettes = {
      [p300SingleId]: true,
      [p300MultiId]: false,
    }

    const result = dropAllTips()(invariantContext, initialRobotState)
    expect(result.commands).toHaveLength(1)
    expect(result.commands[0].params).toMatchObject({ pipette: p300SingleId })

    expectNoTipsRemaining(result.robotState)
  })

  test('should drop tips for both pipettes, with 2 pipettes that have tips', () => {
    initialRobotState.tipState.pipettes = {
      [p300SingleId]: true,
      [p300MultiId]: true,
    }

    const result = dropAllTips()(invariantContext, initialRobotState)
    // order of which pipettes drops tips first is arbitrary
    expect(result.commands).toHaveLength(2)

    expectNoTipsRemaining(result.robotState)
  })
})
