// @flow
import {createRobotState} from './fixtures'
import {dispense} from '../'

describe('dispense', () => {
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

  test('dispense with tip', () => {
    const result = dispense({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1'
    })(robotStateWithTip)

    expect(result.commands).toEqual([{
      command: 'dispense',
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1'
    }])
  })

  test('dispensing without tip should throw error', () => {
    expect(() => dispense({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1'
    })(initialRobotState)).toThrow(/Attempted to dispense with no tip on pipette/)
  })

  // TODO Ian 2018-02-12... what is excessive volume?
  // Is it OK to dispense vol > pipette max vol?
  // LATER: shouldn't dispense > volume of liquid in pipette
  test.skip('dispense with excessive volume should throw error')
})
