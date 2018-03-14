// @flow
import touchTip from '../touchTip'
import {createRobotState} from './fixtures'

describe('touchTip', () => {
  const _robotFixtureArgs = {
    sourcePlateType: 'trough-12row',
    destPlateType: '96-flat',
    fillTiprackTips: true,
    fillPipetteTips: false,
    tipracks: [200, 200]
  }
  const initialRobotState = createRobotState(_robotFixtureArgs)
  const robotStateWithTip = createRobotState({..._robotFixtureArgs, fillPipetteTips: true})

  test('touchTip with tip', () => {
    const result = touchTip({
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1'
    })(robotStateWithTip)

    expect(result.commands).toEqual([{
      command: 'touch-tip',
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1'
    }])

    expect(result.robotState).toEqual(robotStateWithTip)
  })

  test('touchTip with invalid pipette ID should throw error', () => {
    expect(() => touchTip({
      pipette: 'badPipette',
      labware: 'sourcePlateId',
      well: 'A1'
    })(robotStateWithTip)).toThrow(/Attempted to touchTip with pipette id .* this pipette was not found/)
  })

  test('touchTip with no tip should throw error', () => {
    expect(() => touchTip({
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1'
    })(initialRobotState)).toThrow(/Attempted to touchTip with no tip on pipette/)
  })
})
