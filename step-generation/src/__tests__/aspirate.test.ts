import { when } from 'jest-when'
import { expectTimelineError } from '../__utils__/testMatchers'
import { aspirate } from '../commandCreators/atomic/aspirate'
import { getLabwareDefURI, getPipetteNameSpecs } from '@opentrons/shared-data'
import _fixtureTiprack10ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import _fixtureTiprack1000ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'
import {
  pipetteIntoHeaterShakerLatchOpen,
  thermocyclerPipetteCollision,
  pipetteIntoHeaterShakerWhileShaking,
  getIsHeaterShakerEastWestWithLatchOpen,
  pipetteAdjacentHeaterShakerWhileShaking,
  getIsHeaterShakerEastWestMultiChannelPipette,
  getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette,
} from '../utils'
import {
  getInitialRobotStateStandard,
  getRobotStateWithTipStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
  getInitialRobotStateWithOffDeckLabwareStandard,
} from '../fixtures'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { AspDispAirgapParams } from '@opentrons/shared-data/protocol/types/schemaV3'
import type { InvariantContext, RobotState } from '../'

const fixtureTiprack10ul = _fixtureTiprack10ul as LabwareDefinition2
const fixtureTiprack1000ul = _fixtureTiprack1000ul as LabwareDefinition2
const FLEX_PIPETTE = 'p1000_single_gen3'
const FlexPipetteNameSpecs = getPipetteNameSpecs(FLEX_PIPETTE)

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

describe('aspirate', () => {
  let initialRobotState: RobotState
  let robotStateWithTip: RobotState
  let invariantContext: InvariantContext
  let flowRateAndOffsets: Partial<AspDispAirgapParams>
  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
    flowRateAndOffsets = {
      flowRate: 6,
      offsetFromBottomMm: 5,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('aspirate normally (with tip)', () => {
    const params = {
      ...flowRateAndOffsets,
      pipette: DEFAULT_PIPETTE,
      volume: 50,
      labware: SOURCE_LABWARE,
      well: 'A1',
    } as AspDispAirgapParams
    const result = aspirate(params, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'aspirate',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          volume: 50,
          labwareId: SOURCE_LABWARE,
          wellName: 'A1',
          flowRate: 6,
          wellLocation: {
            origin: 'bottom',
            offset: {
              z: 5,
            },
          },
        },
      },
    ])
  })
  it('aspirate with volume > tip max volume should throw error', () => {
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackDefURI = getLabwareDefURI(fixtureTiprack10ul)
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackLabwareDef = fixtureTiprack10ul
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 201,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'TIP_VOLUME_EXCEEDED',
    })
  })
  it('aspirate with volume > pipette max volume should throw error', () => {
    // NOTE: assigning p300 to a 1000uL tiprack is nonsense, just for this test
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackDefURI = getLabwareDefURI(fixtureTiprack1000ul)
    invariantContext.pipetteEntities[
      DEFAULT_PIPETTE
    ].tiprackLabwareDef = fixtureTiprack1000ul
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 301,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'PIPETTE_VOLUME_EXCEEDED',
    })
  })
  it('aspirate with invalid pipette ID should return error', () => {
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: 'badPipette',
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expectTimelineError(getErrorResult(result).errors, 'PIPETTE_DOES_NOT_EXIST')
  })
  it('aspirate with no tip should return error', () => {
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      initialRobotState
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'NO_TIP_ON_PIPETTE',
    })
  })
  it('aspirate from nonexistent labware should return error', () => {
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: 'problematicLabwareId',
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })
  it('should return an error when aspirating from labware off deck', () => {
    initialRobotState = getInitialRobotStateWithOffDeckLabwareStandard(
      invariantContext
    )

    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      initialRobotState
    )
    expect(getErrorResult(result).errors).toHaveLength(2)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_OFF_DECK',
    })
  })
  it('should return an error when aspirating from thermocycler with pipette collision', () => {
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
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'THERMOCYCLER_LID_CLOSED',
    })
  })
  it('should return an error when aspirating from heaterShaker with latch opened', () => {
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
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_LATCH_OPEN',
    })
  })
  it('should return an error when aspirating from heaterShaker with latch opened for Flex', () => {
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
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_LATCH_OPEN',
    })
  })
  it('should return an error when aspirating from heaterShaker when it is shaking', () => {
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
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_IS_SHAKING',
    })
  })
  it('should return an error when aspirating from heaterShaker when it is shaking for flex', () => {
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
    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_IS_SHAKING',
    })
  })
  it('should return an error when aspirating east/west of a heater shaker with a multi channel pipette', () => {
    when(mockGetIsHeaterShakerEastWestMultiChannelPipette)
      .calledWith(
        robotStateWithTip.modules,
        robotStateWithTip.labware[SOURCE_LABWARE].slot,
        expect.anything()
      )
      .mockReturnValue(true)

    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_EAST_WEST_MULTI_CHANNEL',
    })
  })
  it('should return an error when aspirating east/west of a heater shaker with its latch open', () => {
    when(mockGetIsHeaterShakerEastWestWithLatchOpen)
      .calledWith(
        robotStateWithTip.modules,
        robotStateWithTip.labware[SOURCE_LABWARE].slot
      )
      .mockReturnValue(true)

    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_EAST_WEST_LATCH_OPEN',
    })
  })
  it('should return an error when aspirating north/south/east/west of a heater shaker while it is shaking', () => {
    when(mockPipetteAdjacentHeaterShakerWhileShaking)
      .calledWith(
        robotStateWithTip.modules,
        robotStateWithTip.labware[SOURCE_LABWARE].slot
      )
      .mockReturnValue(true)

    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_NORTH_SOUTH_EAST_WEST_SHAKING',
    })
  })
  it('should return an error when aspirating north/south of a heater shaker from a non tiprack using a multi channel pipette', () => {
    when(mockGetIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette)
      .calledWith(
        robotStateWithTip.modules,
        robotStateWithTip.labware[SOURCE_LABWARE].slot,
        expect.anything(),
        expect.anything()
      )
      .mockReturnValue(true)

    const result = aspirate(
      {
        ...flowRateAndOffsets,
        pipette: DEFAULT_PIPETTE,
        volume: 50,
        labware: SOURCE_LABWARE,
        well: 'A1',
      } as AspDispAirgapParams,
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_NORTH_SOUTH__OF_NON_TIPRACK_WITH_MULTI_CHANNEL',
    })
  })
})
