// @flow
import {
  getInitialRobotStateStandard,
  // getRobotStateWithTipStandard,
  makeStateArgsStandard,
  makeContext,
  makeState,
  getSuccessResult,
  DEFAULT_PIPETTE,
  FIXED_TRASH_ID,
} from './fixtures'
import dropTip from '../commandCreators/atomic/dropTip'

import { dispenseUpdateLiquidState } from '../getNextRobotStateAndWarnings/dispenseUpdateLiquidState'

jest.mock('../getNextRobotStateAndWarnings/dispenseUpdateLiquidState')

describe('dropTip', () => {
  let invariantContext
  let initialRobotState
  // let robotStateWithTip

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    // robotStateWithTip = getRobotStateWithTipStandard(invariantContext)

    // TODO IMMEDIATELY handle in tip pickup state updaters
    // $FlowFixMe: mock methods
    dispenseUpdateLiquidState.mockClear()
    // $FlowFixMe: mock methods
    dispenseUpdateLiquidState.mockReturnValue(initialRobotState.liquidState)
  })

  // TODO Ian 2019-04-19: this is a ONE-OFF fixture
  function makeRobotState(args: {
    singleHasTips: boolean,
    multiHasTips: boolean,
  }) {
    let _robotState = makeState({
      ...makeStateArgsStandard(),
      invariantContext,
      tiprackSetting: { tiprack1Id: true },
    })
    _robotState.tipState.pipettes.p300SingleId = args.singleHasTips
    _robotState.tipState.pipettes.p300MultiId = args.multiHasTips
    return _robotState
  }

  describe('replaceTip: single channel', () => {
    test('drop tip if there is a tip', () => {
      const result = dropTip(
        { pipette: DEFAULT_PIPETTE },
        invariantContext,
        makeRobotState({ singleHasTips: true, multiHasTips: true })
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        {
          command: 'dropTip',
          params: {
            pipette: DEFAULT_PIPETTE,
            labware: FIXED_TRASH_ID,
            well: 'A1',
          },
        },
      ])

      // TODO IMMEDIATELY handle in tip pickup state updaters
      // expect(res.robotState).toEqual(
      //   makeRobotState({ singleHasTips: false, multiHasTips: true })
      // )
    })

    test('no tip on pipette, ignore dropTip', () => {
      const initialRobotState = makeRobotState({
        singleHasTips: false,
        multiHasTips: true,
      })
      const result = dropTip(
        { pipette: DEFAULT_PIPETTE },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([])
      // TODO IMMEDIATELY handle in tip pickup state updaters
      // expect(res.robotState).toEqual(initialRobotState)
    })
  })

  describe('Multi-channel dropTip', () => {
    test('drop tip if there is a tip', () => {
      const result = dropTip(
        { pipette: 'p300MultiId' },
        invariantContext,
        makeRobotState({ singleHasTips: true, multiHasTips: true })
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        {
          command: 'dropTip',
          params: {
            pipette: 'p300MultiId',
            labware: FIXED_TRASH_ID,
            well: 'A1',
          },
        },
      ])

      // TODO IMMEDIATELY handle in tip pickup state updaters
      // expect(res.robotState).toEqual(
      //   makeRobotState({ singleHasTips: true, multiHasTips: false })
      // )
    })

    test('no tip on pipette, ignore dropTip', () => {
      const initialRobotState = makeRobotState({
        singleHasTips: true,
        multiHasTips: false,
      })
      const result = dropTip(
        { pipette: 'p300MultiId' },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([])

      // TODO IMMEDIATELY handle in tip pickup state updaters
      // expect(res.robotState).toEqual(initialRobotState)
    })
  })

  // TODO IMMEDIATELY handle in tip pickup state updaters

  // describe('liquid tracking', () => {
  //   const mockLiquidReturnValue = 'expected liquid state'
  //   beforeEach(() => {
  //     // $FlowFixMe
  //     dispenseUpdateLiquidState.mockReturnValue(mockLiquidReturnValue)
  //   })

  //   test('dropTip calls dispenseUpdateLiquidState with useFullVolume: true', () => {
  //     const initialRobotState = makeRobotState({
  //       singleHasTips: true,
  //       multiHasTips: true,
  //     })

  //     const result = dropTip(
  //       { pipette: 'p300MultiId' },
  //       invariantContext,
  //       initialRobotState
  //     )
  //     const res = getSuccessResult(result)
  //     expect(dispenseUpdateLiquidState).toHaveBeenCalledWith(
  //       {
  //         invariantContext,
  //         pipetteId: 'p300MultiId',
  //         labwareId: FIXED_TRASH_ID,
  //         useFullVolume: true,
  //         well: 'A1',
  //       },
  //       robotStateWithTip.liquidState
  //     )

  //     expect(res.robotState.liquidState).toBe(mockLiquidReturnValue)
  //   })
  // })
})
