// @flow
import type {RobotState} from '../types'
import {createRobotState, commandCreatorNoErrors} from './fixtures'
import _dropAllTips from '../dropAllTips'

const dropAllTips = commandCreatorNoErrors(_dropAllTips)

const p300SingleId = 'p300SingleId'
const p300MultiId = 'p300MultiId'

let initialRobotState

beforeEach(() => {
  initialRobotState = createRobotState({
    sourcePlateType: 'trough-12row',
    destPlateType: '96-flat',
    fillTiprackTips: true,
    fillPipetteTips: false,
    tipracks: [200, 200],
  })
})

function expectNoTipsRemaining (robotState: RobotState) {
  const pipetteIds = Object.keys(robotState.tipState.pipettes)
  pipetteIds.forEach(pipetteId => {
    expect(robotState.tipState.pipettes[pipetteId]).toBe(false)
  })
}

describe('drop all tips', () => {
  test('should do nothing with no pipettes', () => {
    initialRobotState.instruments = {}
    initialRobotState.tipState.pipettes = {}

    const result = dropAllTips()(initialRobotState)
    expect(result.commands).toHaveLength(0)
    expectNoTipsRemaining(result.robotState)
  })

  test('should do nothing with pipette that does not have tips', () => {
    const result = dropAllTips()(initialRobotState)
    expect(result.commands).toHaveLength(0)
    expectNoTipsRemaining(result.robotState)
  })

  test('should drop tips of one pipette that has them, and not one without', () => {
    initialRobotState.tipState.pipettes = {
      [p300SingleId]: true,
      [p300MultiId]: false,
    }

    const result = dropAllTips()(initialRobotState)
    expect(result.commands).toHaveLength(1)
    expect(result.commands[0].params).toMatchObject({pipette: p300SingleId})

    expectNoTipsRemaining(result.robotState)
  })

  test('should drop tips for both pipettes, with 2 pipettes that have tips', () => {
    initialRobotState.tipState.pipettes = {
      [p300SingleId]: true,
      [p300MultiId]: true,
    }

    const result = dropAllTips()(initialRobotState)
    // order of which pipettes drops tips first is arbitrary
    expect(result.commands).toHaveLength(2)

    expectNoTipsRemaining(result.robotState)
  })
})
