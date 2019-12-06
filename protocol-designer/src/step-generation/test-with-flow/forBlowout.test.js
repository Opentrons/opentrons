// @flow
import { forBlowout } from '../getNextRobotStateAndWarnings/forBlowout'
import {
  makeContext,
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from './fixtures'

import { dispenseUpdateLiquidState } from '../getNextRobotStateAndWarnings/dispenseUpdateLiquidState'

jest.mock('../getNextRobotStateAndWarnings/dispenseUpdateLiquidState')

let invariantContext
let initialRobotState
let robotStateWithTip
let params

beforeEach(() => {
  invariantContext = makeContext()
  initialRobotState = getInitialRobotStateStandard(invariantContext)
  robotStateWithTip = getRobotStateWithTipStandard(invariantContext)

  // $FlowFixMe: mock methods
  dispenseUpdateLiquidState.mockClear()
  // $FlowFixMe: mock methods
  dispenseUpdateLiquidState.mockReturnValue(initialRobotState.liquidState)

  params = {
    pipette: DEFAULT_PIPETTE,
    labware: SOURCE_LABWARE,
    well: 'A1',
    flowRate: 21.1,
    offsetFromBottomMm: 1.3,
  }
})

describe('Blowout command', () => {
  describe('liquid tracking', () => {
    const mockLiquidReturnValue = 'expected liquid state'
    beforeEach(() => {
      // $FlowFixMe
      dispenseUpdateLiquidState.mockReturnValue(mockLiquidReturnValue)
    })

    test('blowout calls dispenseUpdateLiquidState with max volume of pipette', () => {
      const result = forBlowout(params, invariantContext, robotStateWithTip)

      expect(dispenseUpdateLiquidState).toHaveBeenCalledWith({
        invariantContext,
        labware: SOURCE_LABWARE,
        pipette: DEFAULT_PIPETTE,
        prevLiquidState: robotStateWithTip.liquidState,
        useFullVolume: true,
        well: 'A1',
      })

      expect(result.robotState.liquidState).toBe(mockLiquidReturnValue)
    })
  })
})
