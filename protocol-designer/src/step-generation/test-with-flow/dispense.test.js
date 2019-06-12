// @flow
import {
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  makeContext,
  getErrorResult,
  getSuccessResult,
} from './fixtures'
import dispense from '../commandCreators/atomic/dispense'

import updateLiquidState from '../dispenseUpdateLiquidState'

jest.mock('../dispenseUpdateLiquidState')
jest.mock('../../labware-defs/utils') // TODO IMMEDIATELY move to somewhere more general

describe('dispense', () => {
  let initialRobotState
  let robotStateWithTip
  let invariantContext

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)

    // $FlowFixMe: mock methods
    updateLiquidState.mockClear()
    // $FlowFixMe: mock methods
    updateLiquidState.mockReturnValue(initialRobotState.liquidState)
  })

  describe('tip tracking & commands:', () => {
    let params
    beforeEach(() => {
      params = {
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1',
        offsetFromBottomMm: 5,
        flowRate: 6,
      }
    })
    test('dispense normally (with tip)', () => {
      const result = dispense(params)(invariantContext, robotStateWithTip)

      expect(getSuccessResult(result).commands).toEqual([
        {
          command: 'dispense',
          params,
        },
      ])
    })

    test('dispensing without tip should throw error', () => {
      const result = dispense(params)(invariantContext, initialRobotState)

      const res = getErrorResult(result)
      expect(res.errors).toHaveLength(1)
      expect(res.errors[0]).toMatchObject({
        type: 'NO_TIP_ON_PIPETTE',
      })
    })

    test('dispense to nonexistent labware should throw error', () => {
      const result = dispense({
        ...params,
        labware: 'someBadLabwareId',
      })(invariantContext, robotStateWithTip)

      const res = getErrorResult(result)
      expect(res.errors).toHaveLength(1)
      expect(res.errors[0]).toMatchObject({
        type: 'LABWARE_DOES_NOT_EXIST',
      })
    })

    // TODO Ian 2018-02-12... what is excessive volume?
    // Is it OK to dispense vol > pipette max vol?
    // LATER: shouldn't dispense > volume of liquid in pipette
    test.skip('dispense with excessive volume should... ?', () => {})
  })

  describe('liquid tracking', () => {
    const mockLiquidReturnValue = 'expected liquid state'
    beforeEach(() => {
      // $FlowFixMe
      updateLiquidState.mockReturnValue(mockLiquidReturnValue)
    })

    test('dispense calls dispenseUpdateLiquidState with correct args and puts result into robotState.liquidState', () => {
      const params = {
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1',
        volume: 152,
        flowRate: 12,
        offsetFromBottomMm: 21,
      }
      const result = dispense(params)(invariantContext, robotStateWithTip)

      expect(updateLiquidState).toHaveBeenCalledWith(
        {
          invariantContext,
          pipetteId: params.pipette,
          labwareId: params.labware,
          volume: params.volume,
          well: params.well,
        },
        robotStateWithTip.liquidState
      )

      expect(getSuccessResult(result).robotState.liquidState).toBe(
        mockLiquidReturnValue
      )
    })
  })
})
