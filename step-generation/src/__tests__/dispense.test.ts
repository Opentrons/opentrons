import { when } from 'jest-when'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import {
  thermocyclerPipetteCollision,
  pipetteIntoHeaterShakerLatchOpen,
  pipetteIntoHeaterShakerWhileShaking,
  getIsHeaterShakerEastWestWithLatchOpen,
  pipetteAdjacentHeaterShakerWhileShaking,
  getIsHeaterShakerEastWestMultiChannelPipette,
  getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette,
} from '../utils'
import {
  getInitialRobotStateStandard,
  getInitialRobotStateWithOffDeckLabwareStandard,
  getRobotStateWithTipStandard,
  makeContext,
  getErrorResult,
  getSuccessResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from '../fixtures'
import { dispense } from '../commandCreators/atomic/dispense'
import { InvariantContext, RobotState } from '../types'
import type {
  AspDispAirgapParams as V3AspDispAirgapParams,
  DispenseParams,
} from '@opentrons/shared-data/protocol/types/schemaV3'

jest.mock('../utils/thermocyclerPipetteCollision')
jest.mock('../utils/heaterShakerCollision')

const mockThermocyclerPipetteCollision = thermocyclerPipetteCollision as jest.MockedFunction<
  typeof thermocyclerPipetteCollision
>
const mockPipetteIntoHeaterShakerLatchOpen = pipetteIntoHeaterShakerLatchOpen as jest.MockedFunction<
  typeof pipetteIntoHeaterShakerLatchOpen
>
const mockPipetteIntoHeaterShakerWhileShaking = pipetteIntoHeaterShakerWhileShaking as jest.MockedFunction<
  typeof pipetteIntoHeaterShakerWhileShaking
>
const mockGetIsHeaterShakerEastWestWithLatchOpen = getIsHeaterShakerEastWestWithLatchOpen as jest.MockedFunction<
  typeof getIsHeaterShakerEastWestWithLatchOpen
>
const mockGetIsHeaterShakerEastWestMultiChannelPipette = getIsHeaterShakerEastWestMultiChannelPipette as jest.MockedFunction<
  typeof getIsHeaterShakerEastWestMultiChannelPipette
>
const mockPipetteAdjacentHeaterShakerWhileShaking = pipetteAdjacentHeaterShakerWhileShaking as jest.MockedFunction<
  typeof pipetteAdjacentHeaterShakerWhileShaking
>
const mockGetIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette = getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette as jest.MockedFunction<
  typeof getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette
>

const FLEX_PIPETTE = 'p1000_single_flex'
const FlexPipetteNameSpecs = getPipetteNameSpecs(FLEX_PIPETTE)

describe('dispense', () => {
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
    let params: V3AspDispAirgapParams
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
          commandType: 'dispense',
          key: expect.any(String),
          params: {
            pipetteId: DEFAULT_PIPETTE,
            volume: 50,
            labwareId: SOURCE_LABWARE,
            wellName: 'A1',
            wellLocation: {
              origin: 'bottom',
              offset: {
                z: 5,
              },
            },
            flowRate: 6,
          },
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
    it('should return an error when dispensing from labware off deck', () => {
      initialRobotState = getInitialRobotStateWithOffDeckLabwareStandard(
        invariantContext
      )
      const result = dispense(
        {
          flowRate: 10,
          offsetFromBottomMm: 5,
          pipette: DEFAULT_PIPETTE,
          volume: 50,
          labware: SOURCE_LABWARE,
          well: 'A1',
        } as DispenseParams,
        invariantContext,
        initialRobotState
      )
      expect(getErrorResult(result).errors).toHaveLength(2)
      expect(getErrorResult(result).errors[1]).toMatchObject({
        type: 'LABWARE_OFF_DECK',
      })
    })
    it('dispense to nonexistent labware should throw error', () => {
      const result = dispense(
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
      const result = dispense(params, invariantContext, robotStateWithTip)
      const res = getErrorResult(result)
      expect(res.errors).toHaveLength(1)
      expect(res.errors[0]).toMatchObject({
        type: 'THERMOCYCLER_LID_CLOSED',
      })
    })
    it('should return an error when dispensing into heater shaker with latch open', () => {
      mockPipetteIntoHeaterShakerLatchOpen.mockImplementationOnce(
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
      const result = dispense(params, invariantContext, robotStateWithTip)
      const res = getErrorResult(result)
      expect(res.errors).toHaveLength(1)
      expect(res.errors[0]).toMatchObject({
        type: 'HEATER_SHAKER_LATCH_OPEN',
      })
    })
    it('should return an error when dispensing into heater shaker with latch open for flex', () => {
      if (FlexPipetteNameSpecs != null) {
        invariantContext.pipetteEntities[
          DEFAULT_PIPETTE
        ].spec = FlexPipetteNameSpecs
      }

      mockPipetteIntoHeaterShakerLatchOpen.mockImplementationOnce(
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
      const result = dispense(params, invariantContext, robotStateWithTip)
      const res = getErrorResult(result)
      expect(res.errors).toHaveLength(1)
      expect(res.errors[0]).toMatchObject({
        type: 'HEATER_SHAKER_LATCH_OPEN',
      })
    })
    it('should return an error when dispensing into heater-shaker when it is shaking', () => {
      mockPipetteIntoHeaterShakerWhileShaking.mockImplementationOnce(
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
      const result = dispense(params, invariantContext, robotStateWithTip)
      const res = getErrorResult(result)
      expect(res.errors).toHaveLength(1)
      expect(res.errors[0]).toMatchObject({
        type: 'HEATER_SHAKER_IS_SHAKING',
      })
    })
    it('should return an error when dispensing into heater-shaker when it is shaking for flex', () => {
      if (FlexPipetteNameSpecs != null) {
        invariantContext.pipetteEntities[
          DEFAULT_PIPETTE
        ].spec = FlexPipetteNameSpecs
      }

      mockPipetteIntoHeaterShakerWhileShaking.mockImplementationOnce(
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
      const result = dispense(params, invariantContext, robotStateWithTip)
      const res = getErrorResult(result)
      expect(res.errors).toHaveLength(1)
      expect(res.errors[0]).toMatchObject({
        type: 'HEATER_SHAKER_IS_SHAKING',
      })
    })
    it('should return an error when dispensing east/west of a heater shaker with its latch open', () => {
      when(mockGetIsHeaterShakerEastWestWithLatchOpen)
        .calledWith(
          robotStateWithTip.modules,
          robotStateWithTip.labware[SOURCE_LABWARE].slot
        )
        .mockReturnValue(true)

      const result = dispense(params, invariantContext, robotStateWithTip)
      expect(getErrorResult(result).errors).toHaveLength(1)
      expect(getErrorResult(result).errors[0]).toMatchObject({
        type: 'HEATER_SHAKER_EAST_WEST_LATCH_OPEN',
      })
    })
    it('should return an error when dispensing east/west of a heater shaker with a multi channel pipette', () => {
      when(mockGetIsHeaterShakerEastWestMultiChannelPipette)
        .calledWith(
          robotStateWithTip.modules,
          robotStateWithTip.labware[SOURCE_LABWARE].slot,
          expect.anything()
        )
        .mockReturnValue(true)

      const result = dispense(params, invariantContext, robotStateWithTip)
      expect(getErrorResult(result).errors).toHaveLength(1)
      expect(getErrorResult(result).errors[0]).toMatchObject({
        type: 'HEATER_SHAKER_EAST_WEST_MULTI_CHANNEL',
      })
    })
    it('should return an error when dispensing north/south/east/west of a heater shaker while it is shaking', () => {
      when(mockPipetteAdjacentHeaterShakerWhileShaking)
        .calledWith(
          robotStateWithTip.modules,
          robotStateWithTip.labware[SOURCE_LABWARE].slot
        )
        .mockReturnValue(true)

      const result = dispense(params, invariantContext, robotStateWithTip)
      expect(getErrorResult(result).errors).toHaveLength(1)
      expect(getErrorResult(result).errors[0]).toMatchObject({
        type: 'HEATER_SHAKER_NORTH_SOUTH_EAST_WEST_SHAKING',
      })
    })
    it('should return an error when dispensing north/south of a heater shaker into a non tiprack using a multi channel pipette', () => {
      when(mockGetIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette)
        .calledWith(
          robotStateWithTip.modules,
          robotStateWithTip.labware[SOURCE_LABWARE].slot,
          expect.anything(),
          expect.anything()
        )
        .mockReturnValue(true)

      const result = dispense(params, invariantContext, robotStateWithTip)
      expect(getErrorResult(result).errors).toHaveLength(1)
      expect(getErrorResult(result).errors[0]).toMatchObject({
        type: 'HEATER_SHAKER_NORTH_SOUTH__OF_NON_TIPRACK_WITH_MULTI_CHANNEL',
      })
    })
  })
})
