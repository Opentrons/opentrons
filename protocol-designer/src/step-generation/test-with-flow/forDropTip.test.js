// @flow
import {
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  makeStateArgsStandard,
  makeContext,
  makeState,
  DEFAULT_PIPETTE,
  FIXED_TRASH_ID,
} from './fixtures'
import { forDropTip } from '../getNextRobotStateAndWarnings/forDropTip'

import { dispenseUpdateLiquidState } from '../getNextRobotStateAndWarnings/dispenseUpdateLiquidState'

jest.mock('../getNextRobotStateAndWarnings/dispenseUpdateLiquidState')

describe('dropTip', () => {
  let invariantContext
  let initialRobotState
  let robotStateWithTip

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)

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
      const prevRobotState = makeRobotState({
        singleHasTips: true,
        multiHasTips: true,
      })

      const params = {
        pipette: DEFAULT_PIPETTE,
        labware: FIXED_TRASH_ID,
        well: 'A1',
      }

      const result = forDropTip(params, invariantContext, prevRobotState)
      expect(result.warnings).toEqual([])
      expect(result.robotState).toEqual(
        makeRobotState({ singleHasTips: false, multiHasTips: true })
      )
    })

    // TODO: IL 2019-11-20
    test.skip('no tip on pipette', () => {})
  })

  describe('Multi-channel dropTip', () => {
    test('drop tip when there are tips', () => {
      const prevRobotState = makeRobotState({
        singleHasTips: true,
        multiHasTips: true,
      })

      const params = {
        pipette: 'p300MultiId',
        labware: FIXED_TRASH_ID,
        well: 'A1',
      }

      const res = forDropTip(params, invariantContext, prevRobotState)
      expect(res.robotState).toEqual(
        makeRobotState({ singleHasTips: true, multiHasTips: false })
      )
    })

    // TODO: IL 2019-11-20
    test.skip('no tip on pipette', () => {})
  })

  describe('liquid tracking', () => {
    const mockLiquidReturnValue = 'expected liquid state'
    beforeEach(() => {
      // $FlowFixMe: mock methods
      dispenseUpdateLiquidState.mockClear()
      // $FlowFixMe: mock methods
      dispenseUpdateLiquidState.mockReturnValue(mockLiquidReturnValue)
    })

    test('dropTip calls dispenseUpdateLiquidState with useFullVolume: true', () => {
      const prevRobotState = makeRobotState({
        singleHasTips: true,
        multiHasTips: true,
      })

      const params = {
        pipette: 'p300MultiId',
        labware: FIXED_TRASH_ID,
        well: 'A1',
      }
      const result = forDropTip(params, invariantContext, prevRobotState)
      expect(dispenseUpdateLiquidState).toHaveBeenCalledWith({
        invariantContext,
        pipette: 'p300MultiId',
        labware: FIXED_TRASH_ID,
        useFullVolume: true,
        well: 'A1',
        prevLiquidState: robotStateWithTip.liquidState,
      })

      expect(result.robotState.liquidState).toBe(mockLiquidReturnValue)
    })
  })
})
