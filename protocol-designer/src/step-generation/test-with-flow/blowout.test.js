// @flow
import _blowout from '../blowout'
import {createRobotState, commandCreatorNoErrors, commandCreatorHasErrors} from './fixtures'

import updateLiquidState from '../dispenseUpdateLiquidState'

const blowout = commandCreatorNoErrors(_blowout)
const blowoutWithErrors = commandCreatorHasErrors(_blowout)

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
      tipracks: [200, 200],
    })

    robotStateWithTip = {
      ...initialRobotState,
      tipState: {
        ...initialRobotState.tipState,
        pipettes: {
          ...initialRobotState.tipState.pipettes,
          p300SingleId: true,
        },
      },
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
      well: 'A1',
    })(robotStateWithTip)

    expect(result.commands).toEqual([{
      command: 'blowout',
      params: {
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1',
      },
    }])

    expect(result.robotState).toEqual(robotStateWithTip)
  })

  test('blowout with invalid pipette ID should throw error', () => {
    const result = blowoutWithErrors({
      pipette: 'badPipette',
      labware: 'sourcePlateId',
      well: 'A1',
    })(robotStateWithTip)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'PIPETTE_DOES_NOT_EXIST',
    })
  })

  test('blowout with no tip should throw error', () => {
    const result = blowoutWithErrors({
      pipette: 'p300SingleId',
      labware: 'sourcePlateId',
      well: 'A1',
    })(initialRobotState)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'NO_TIP_ON_PIPETTE',
    })
  })

  describe('liquid tracking', () => {
    const mockLiquidReturnValue = 'expected liquid state'
    beforeEach(() => {
      // $FlowFixMe
      updateLiquidState.mockReturnValue(mockLiquidReturnValue)
    })

    test('blowout calls dispenseUpdateLiquidState with max volume of pipette', () => {
      const result = blowout({
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1',
      })(robotStateWithTip)

      expect(updateLiquidState).toHaveBeenCalledWith({
        pipetteId: 'p300SingleId',
        labwareId: 'sourcePlateId',
        volume: 300, // pipette's max vol
        well: 'A1',
        labwareType: 'trough-12row',
        pipetteData: robotStateWithTip.instruments.p300SingleId,
      }, robotStateWithTip.liquidState)

      expect(result.robotState.liquidState).toBe(mockLiquidReturnValue)
    })
  })
})
