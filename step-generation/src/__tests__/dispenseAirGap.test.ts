import { thermocyclerPipetteCollision } from '../utils'
import {
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  makeContext,
  getErrorResult,
  getSuccessResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from '../fixtures'
import { dispenseAirGap } from '../commandCreators/atomic/dispenseAirGap'
import { AspDispAirgapParams } from '@opentrons/shared-data/protocol/types/schemaV3'
import type { InvariantContext, RobotState } from '../types'

jest.mock('../utils/thermocyclerPipetteCollision')
const mockThermocyclerPipetteCollision = thermocyclerPipetteCollision as jest.MockedFunction<
  typeof thermocyclerPipetteCollision
>
describe('dispenseAirGap', () => {
  let initialRobotState: RobotState
  let robotStateWithTip: RobotState
  let invariantContext: InvariantContext
  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  describe('tip tracking & commands:', () => {
    let params: AspDispAirgapParams
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
      const result = dispenseAirGap(params, invariantContext, robotStateWithTip)
      expect(getSuccessResult(result).commands).toEqual([
        {
          command: 'dispenseAirGap',
          params,
        },
      ])
    })
    it('dispensing without tip should throw error', () => {
      const result = dispenseAirGap(params, invariantContext, initialRobotState)
      const res = getErrorResult(result)
      expect(res.errors).toHaveLength(1)
      expect(res.errors[0]).toMatchObject({
        type: 'NO_TIP_ON_PIPETTE',
      })
    })
    it('dispense to nonexistent labware should throw error', () => {
      const result = dispenseAirGap(
        { ...params, labware: 'someBadLabwareId' },
        invariantContext,
        robotStateWithTip
      )
      const res = getErrorResult(result)
      expect(res.errors).toHaveLength(1)
      expect(res.errors[0]).toMatchObject({
        type: 'LABWARE_DOES_NOT_EXIST',
      })
    })
    it('should return an error when dispensing into thermocycler with pipette collision', () => {
      mockThermocyclerPipetteCollision.mockImplementationOnce(
        (
          modules: RobotState['modules'],
          labware: RobotState['labware'],
          labwareId: string
        ) => {
          expect(modules).toBe(robotStateWithTip.modules)
          expect(labware).toBe(robotStateWithTip.labware)
          expect(labwareId).toBe(SOURCE_LABWARE)
          return true
        }
      )
      const result = dispenseAirGap(params, invariantContext, robotStateWithTip)
      const res = getErrorResult(result)
      expect(res.errors).toHaveLength(1)
      expect(res.errors[0]).toMatchObject({
        type: 'THERMOCYCLER_LID_CLOSED',
      })
    })
  })
})
