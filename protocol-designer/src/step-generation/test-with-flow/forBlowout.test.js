// @flow
import { forBlowout } from '../getNextRobotStateAndWarnings/forBlowout'
import {
  makeContext,
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from './fixtures'

import updateLiquidState from '../dispenseUpdateLiquidState'

jest.mock('../dispenseUpdateLiquidState')

let invariantContext
let initialRobotState
let robotStateWithTip
let params

beforeEach(() => {
  invariantContext = makeContext()
  initialRobotState = getInitialRobotStateStandard(invariantContext)
  robotStateWithTip = getRobotStateWithTipStandard(invariantContext)

  // $FlowFixMe: mock methods
  updateLiquidState.mockClear()
  // $FlowFixMe: mock methods
  updateLiquidState.mockReturnValue(initialRobotState.liquidState)

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
      updateLiquidState.mockReturnValue(mockLiquidReturnValue)
    })

    test('blowout calls dispenseUpdateLiquidState with max volume of pipette', () => {
      const result = forBlowout(params, invariantContext, robotStateWithTip)

      expect(updateLiquidState).toHaveBeenCalledWith(
        {
          invariantContext,
          pipetteId: DEFAULT_PIPETTE,
          labwareId: SOURCE_LABWARE,
          useFullVolume: true,
          well: 'A1',
        },
        robotStateWithTip.liquidState
      )

      expect(result.robotState.liquidState).toBe(mockLiquidReturnValue)
    })
  })
})
