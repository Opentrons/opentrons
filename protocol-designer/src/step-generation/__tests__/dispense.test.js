// @flow
import {
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  makeContext,
  getErrorResult,
  getSuccessResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from '../__fixtures__'
import { dispense } from '../commandCreators/atomic/dispense'

describe('dispense', () => {
  let initialRobotState
  let robotStateWithTip
  let invariantContext

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })

  describe('tip tracking & commands:', () => {
    let params
    beforeEach(() => {
      params = {
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
        offsetFromBottomMm: 5,
        flowRate: 6,
      }
    })
    it('dispense normally (with tip)', () => {
      const result = dispense(params, invariantContext, robotStateWithTip)

      expect(getSuccessResult(result).commands).toEqual([
        {
          command: 'dispense',
          params,
        },
      ])
    })

    it('dispensing without tip should throw error', () => {
      const result = dispense(params, invariantContext, initialRobotState)

      const res = getErrorResult(result)
      expect(res.errors).toHaveLength(1)
      expect(res.errors[0]).toMatchObject({
        type: 'NO_TIP_ON_PIPETTE',
      })
    })

    it('dispense to nonexistent labware should throw error', () => {
      const result = dispense(
        {
          ...params,
          labware: 'someBadLabwareId',
        },
        invariantContext,
        robotStateWithTip
      )

      const res = getErrorResult(result)
      expect(res.errors).toHaveLength(1)
      expect(res.errors[0]).toMatchObject({
        type: 'LABWARE_DOES_NOT_EXIST',
      })
    })
  })
})
