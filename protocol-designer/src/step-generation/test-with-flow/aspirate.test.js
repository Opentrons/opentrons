// @flow
import aspirate from '../aspirate'
import {createRobotStateFixture, createRobotState} from './fixtures'

import updateLiquidState from '../aspirateUpdateLiquidState'

jest.mock('../aspirateUpdateLiquidState')

describe('aspirate', () => {
  let initialRobotState
  let robotStateWithTip

  beforeEach(() => {
    initialRobotState = createRobotState({
      sourcePlateType: 'trough-12row',
      destPlateType: '96-flat',
      fillPipetteTips: false,
      fillTiprackTips: true,
      tipracks: [200, 200]
    })
    robotStateWithTip = createRobotState({
      sourcePlateType: 'trough-12row',
      destPlateType: '96-flat',
      fillPipetteTips: true,
      fillTiprackTips: true,
      tipracks: [200, 200]
    })
  })

  // Fixtures without liquidState key, for use with `toMatchObject`
  const robotStateWithTipNoLiquidState = createRobotStateFixture({
    sourcePlateType: 'trough-12row',
    destPlateType: '96-flat',
    fillPipetteTips: true,
    fillTiprackTips: true,
    tipracks: [200, 200]
  })

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

    expect(result.robotState).toMatchObject(robotStateWithTipNoLiquidState)
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

  describe('liquid tracking', () => {
    const mockLiquidReturnValue = 'expected liquid state'
    beforeEach(() => {
      // $FlowFixMe
      updateLiquidState.mockReturnValue(mockLiquidReturnValue)
    })

    test('aspirate calls aspirateUpdateLiquidState with correct args and puts result into robotState.liquidState', () => {
      const result = aspirate({
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1',
        volume: 152
      })(robotStateWithTip)

      expect(updateLiquidState).toHaveBeenCalledWith(
        {
          pipetteId: 'p300SingleId',
          labwareId: 'sourcePlateId',
          volume: 152,
          well: 'A1',
          labwareType: 'trough-12row',
          pipetteData: robotStateWithTip.instruments.p300SingleId
        },
        robotStateWithTip.liquidState
      )

      expect(result.robotState.liquidState).toBe(mockLiquidReturnValue)
    })
  })
})
