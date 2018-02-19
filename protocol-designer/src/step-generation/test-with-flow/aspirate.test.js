// @flow
import aspirate from '../aspirate'
import {getBasicRobotState} from './fixtures'

describe('aspirate', () => {
  const initialRobotState = getBasicRobotState()
  const robotStateWithTip = {
    ...initialRobotState,
    tipState: {
      ...initialRobotState.tipState,
      pipettes: {
        ...initialRobotState.tipState.pipettes,
        p300SingleId: true
      }
    }
  }

  test('aspirate with tip', () => {
    const result = aspirate({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1'
    })(robotStateWithTip)

    expect(result.commands).toEqual([{
      command: 'aspirate',
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1'
    }])

    expect(result.robotState).toEqual(robotStateWithTip)
  })

  test('aspirate with volume > pipette max vol should throw error', () => {
    expect(() => aspirate({
      pipette: 'p300SingleId',
      volume: 10000,
      labware: 'sourcePlateId',
      well: 'A1'
    })(robotStateWithTip)).toThrow(/Attempted to aspirate volume greater than pipette max volume/)
  })

  test('aspirate with invalid pipette ID should throw error', () => {
    expect(() => aspirate({
      pipette: 'badPipette',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1'
    })(robotStateWithTip)).toThrow(/Attempted to aspirate with pipette id .* this pipette was not found/)
  })

  test('aspirate with no tip should throw error', () => {
    expect(() => aspirate({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1'
    })(initialRobotState)).toThrow(/Attempted to aspirate with no tip on pipette/)
  })
})
