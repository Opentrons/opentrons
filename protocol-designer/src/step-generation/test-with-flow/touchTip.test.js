// @flow
import _touchTip from '../touchTip'
import {
  createRobotState,
  commandCreatorNoErrors,
  commandCreatorHasErrors,
} from './fixtures'

const touchTip = commandCreatorNoErrors(_touchTip)
const touchTipWithErrors = commandCreatorHasErrors(_touchTip)

describe('touchTip', () => {
  const _robotFixtureArgs = {
    sourcePlateType: 'trough-12row',
    destPlateType: '96-flat',
    fillTiprackTips: true,
    fillPipetteTips: false,
    tipracks: [200, 200],
  }
  const initialRobotState = createRobotState(_robotFixtureArgs)
  const robotStateWithTip = createRobotState({..._robotFixtureArgs, fillPipetteTips: true})

  test('touchTip with tip', () => {
    const result = touchTip({
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1',
    })(robotStateWithTip)

    expect(result.commands).toEqual([{
      command: 'touch-tip',
      params: {
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1',
      },
    }])

    expect(result.robotState).toEqual(robotStateWithTip)
  })

  test('touchTip with invalid pipette ID should throw error', () => {
    const result = touchTipWithErrors({
      pipette: 'badPipette',
      labware: 'sourcePlateId',
      well: 'A1',
    })(robotStateWithTip)

    expect(result.errors).toEqual([{
      message: 'Attempted to touchTip with pipette id "badPipette", this pipette was not found under "instruments"',
      type: 'PIPETTE_DOES_NOT_EXIST',
    }])
  })

  test('touchTip with no tip should throw error', () => {
    const result = touchTipWithErrors({
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1',
    })(initialRobotState)

    expect(result.errors).toEqual([{
      message: 'Attempted to touchTip with no tip on pipette: p300SingleId from sourcePlateId\'s well A1',
      type: 'NO_TIP_ON_PIPETTE',
    }])
  })
})
