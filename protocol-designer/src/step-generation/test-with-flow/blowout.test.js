// @flow
import omit from 'lodash/omit'
import blowout from '../blowout'
import {createRobotState} from './fixtures'

import updateLiquidState from '../dispenseUpdateLiquidState'

jest.mock('../dispenseUpdateLiquidState')

beforeEach(() => {
  jest.resetAllMocks()
})

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

    expect(result.robotState).toMatchObject(omit(robotStateWithTip, 'liquidState'))
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

      expect(updateLiquidState).toHaveBeenCalledTimes(1)
      // trickery for Flow -- there's no .mock on updateLiquidState fn
      const mockCalls: any = updateLiquidState
      const updateArgs: Array<mixed> = mockCalls.mock.calls[0]

      expect(updateArgs[0]).toMatchObject({
        pipetteId: 'p300SingleId',
        labwareId: 'sourcePlateId',
        volume: 300, // pipette's max vol
        well: 'A1'
      })
      expect(updateArgs[1]).toEqual(robotStateWithTip.liquidState)
    })
  })
})
