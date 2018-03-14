// @flow
import blowout from '../blowout'
import {createRobotState} from './fixtures'

describe('blowout', () => {
  const initialRobotState = createRobotState({
    sourcePlateType: 'trough-12row',
    destPlateType: '96-flat',
    fillTiprackTips: true,
    fillPipetteTips: false,
    tipracks: [200, 200]
  })

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

  test('blowout with tip', () => {
    const result = blowout({
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1'
    })(robotStateWithTip)

    expect(result.commands).toEqual([{
      command: 'blowout',
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1'
    }])

    expect(result.robotState).toEqual(robotStateWithTip)
  })

  test('blowout with invalid pipette ID should throw error', () => {
    expect(() => blowout({
      pipette: 'badPipette',
      labware: 'sourcePlateId',
      well: 'A1'
    })(robotStateWithTip)).toThrow(/Attempted to blowout with pipette id .* this pipette was not found/)
  })

  test('blowout with no tip should throw error', () => {
    expect(() => blowout({
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1'
    })(initialRobotState)).toThrow(/Attempted to blowout with no tip on pipette/)
  })
})
