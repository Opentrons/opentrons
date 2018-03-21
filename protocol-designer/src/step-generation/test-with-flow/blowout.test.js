// @flow
import blowout from '../blowout'
import {createRobotState} from './fixtures'

import updateLiquidState from '../dispenseUpdateLiquidState'

jest.mock('../dispenseUpdateLiquidState')

describe('blowout', () => {
  let initialRobotState
  let robotStateWithTip

  beforeEach(() => {
    initialRobotState = createRobotState({
      sourcePlateType: 'trough-12row',
      destPlateType: '96-flat',
      fillTiprackTips: true,
      fillPipetteTips: false,
      tipracks: [200, 200]
    })

    robotStateWithTip = {
      ...initialRobotState,
      tipState: {
        ...initialRobotState.tipState,
        pipettes: {
          ...initialRobotState.tipState.pipettes,
          p300SingleId: true
        }
      }
    }

    // $FlowFixMe: mock methods
    updateLiquidState.mockClear()
    // $FlowFixMe: mock methods
    updateLiquidState.mockReturnValue(initialRobotState.liquidState)
  })

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

  describe('liquid tracking', () => {
    test('blowout calls dispenseUpdateLiquidState with max volume of pipette', () => {
      blowout({
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1'
      })(robotStateWithTip)

      expect(updateLiquidState).toHaveBeenCalledWith({
        pipetteId: 'p300SingleId',
        labwareId: 'sourcePlateId',
        volume: 300, // pipette's max vol
        well: 'A1',
        labwareType: 'trough-12row',
        pipetteData: robotStateWithTip.instruments.p300SingleId
      }, robotStateWithTip.liquidState)
    })
  })
})
