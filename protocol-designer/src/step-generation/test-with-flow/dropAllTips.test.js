// @flow
import type { RobotState } from '../types'
import {
  makeContext,
  getInitialRobotStateStandard,
  getSuccessResult,
  DEFAULT_PIPETTE,
} from './fixtures'
import dropAllTips from '../commandCreators/atomic/dropAllTips'

const p300SingleId = DEFAULT_PIPETTE
const p300MultiId = 'p300MultiId'

let initialRobotState
let invariantContext

beforeEach(() => {
  invariantContext = makeContext()
  initialRobotState = getInitialRobotStateStandard(invariantContext)
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
    const res = getSuccessResult(result)
    expect(res.commands).toHaveLength(0)
    expectNoTipsRemaining(res.robotState)
  })

  test('should do nothing with pipette that does not have tips', () => {
    const result = dropAllTips()(invariantContext, initialRobotState)
    const res = getSuccessResult(result)
    expect(res.commands).toHaveLength(0)
    expectNoTipsRemaining(res.robotState)
  })

  test('should drop tips of one pipette that has them, and not one without', () => {
    initialRobotState.tipState.pipettes = {
      [p300SingleId]: true,
      [p300MultiId]: false,
    }

    const result = dropAllTips()(invariantContext, initialRobotState)
    const res = getSuccessResult(result)
    expect(res.commands).toHaveLength(1)
    expect(res.commands[0].params).toMatchObject({ pipette: p300SingleId })

    expectNoTipsRemaining(res.robotState)
  })

  test('should drop tips for both pipettes, with 2 pipettes that have tips', () => {
    initialRobotState.tipState.pipettes = {
      [p300SingleId]: true,
      [p300MultiId]: true,
    }

    const result = dropAllTips()(invariantContext, initialRobotState)
    // order of which pipettes drops tips first is arbitrary
    const res = getSuccessResult(result)
    expect(res.commands).toHaveLength(2)

    expectNoTipsRemaining(res.robotState)
  })
})
