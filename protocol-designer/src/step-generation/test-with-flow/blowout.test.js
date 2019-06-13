// @flow
import { expectTimelineError } from './testMatchers'
import blowout from '../commandCreators/atomic/blowout'
import {
  makeContext,
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  getErrorResult,
  getSuccessResult,
} from './fixtures'
import { DEFAULT_PIPETTE, SOURCE_LABWARE } from './fixtures/commandFixtures'

import updateLiquidState from '../dispenseUpdateLiquidState'

jest.mock('../dispenseUpdateLiquidState')

describe('blowout', () => {
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

  test('blowout with tip', () => {
    const result = blowout(params)(invariantContext, robotStateWithTip)

    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        command: 'blowout',
        params,
      },
    ])

    expect(res.robotState).toEqual(robotStateWithTip)
  })

  test('blowout with invalid pipette ID should throw error', () => {
    const result = blowout({
      ...params,
      pipette: 'badPipette',
    })(invariantContext, robotStateWithTip)

    expectTimelineError(getErrorResult(result).errors, 'PIPETTE_DOES_NOT_EXIST')
  })

  test('blowout with invalid labware ID should throw error', () => {
    const result = blowout({
      ...params,
      labware: 'badLabware',
    })(invariantContext, robotStateWithTip)

    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })

  test('blowout with no tip should throw error', () => {
    const result = blowout(params)(invariantContext, initialRobotState)

    const res = getErrorResult(result)
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0]).toMatchObject({
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
      const result = blowout(params)(invariantContext, robotStateWithTip)

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

      expect(getSuccessResult(result).robotState.liquidState).toBe(
        mockLiquidReturnValue
      )
    })
  })
})
