// @flow
import merge from 'lodash/merge'
import {createRobotState, commandCreatorNoErrors} from './fixtures'
import _dropTip from '../dropTip'

import updateLiquidState from '../dispenseUpdateLiquidState'

const dropTip = commandCreatorNoErrors(_dropTip)

jest.mock('../dispenseUpdateLiquidState')

describe('dropTip', () => {
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

  function makeRobotState (args: {singleHasTips: boolean, multiHasTips: boolean}) {
    return merge(
      {},
      createRobotState({
        sourcePlateType: 'trough-12row',
        destPlateType: '96-flat',
        tipracks: [200, 200],
        fillPipetteTips: false,
        fillTiprackTips: true,
      }),
      {
        tipState: {
          pipettes: {
            p300SingleId: args.singleHasTips,
            p300MultiId: args.multiHasTips,
          },
        },
      }
    )
  }

  describe('replaceTip: single channel', () => {
    test('drop tip if there is a tip', () => {
      const result = dropTip('p300SingleId')(makeRobotState({singleHasTips: true, multiHasTips: true})
      )

      expect(result.commands).toEqual([{
        command: 'drop-tip',
        params: {
          pipette: 'p300SingleId',
          labware: 'trashId',
          well: 'A1',
        },
      }])
      expect(result.robotState).toEqual(
        makeRobotState({singleHasTips: false, multiHasTips: true})
      )
    })

    test('no tip on pipette, ignore dropTip', () => {
      const initialRobotState = makeRobotState({singleHasTips: false, multiHasTips: true})
      const result = dropTip('p300SingleId')(initialRobotState)
      expect(result.commands).toEqual([])
      expect(result.robotState).toEqual(initialRobotState)
    })
  })

  describe('Multi-channel dropTip', () => {
    test('drop tip if there is a tip', () => {
      const result = dropTip('p300MultiId')(makeRobotState({singleHasTips: true, multiHasTips: true}))
      expect(result.commands).toEqual([{
        command: 'drop-tip',
        params: {
          pipette: 'p300MultiId',
          labware: 'trashId',
          well: 'A1',
        },
      }])
      expect(result.robotState).toEqual(
        makeRobotState({singleHasTips: true, multiHasTips: false})
      )
    })

    test('no tip on pipette, ignore dropTip', () => {
      const initialRobotState = makeRobotState({singleHasTips: true, multiHasTips: false})
      const result = dropTip('p300MultiId')(initialRobotState)
      expect(result.commands).toEqual([])
      expect(result.robotState).toEqual(initialRobotState)
    })
  })

  describe('liquid tracking', () => {
    const mockLiquidReturnValue = 'expected liquid state'
    beforeEach(() => {
      // $FlowFixMe
      updateLiquidState.mockReturnValue(mockLiquidReturnValue)
    })

    test('dropTip calls dispenseUpdateLiquidState with the max volume of the pipette', () => {
      const initialRobotState = makeRobotState({singleHasTips: true, multiHasTips: true})

      const result = dropTip('p300MultiId')(initialRobotState)

      expect(updateLiquidState).toHaveBeenCalledWith(
        {
          pipetteId: 'p300MultiId',
          labwareId: 'trashId',
          volume: 300, // pipette's max vol
          well: 'A1',
          labwareType: 'fixed-trash',
          pipetteData: robotStateWithTip.instruments.p300MultiId,
        },
        robotStateWithTip.liquidState
      )

      expect(result.robotState.liquidState).toBe(mockLiquidReturnValue)
    })
  })
})
