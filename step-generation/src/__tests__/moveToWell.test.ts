import { when } from 'jest-when'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import { expectTimelineError } from '../__utils__/testMatchers'
import { moveToWell } from '../commandCreators/atomic/moveToWell'
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
  getRobotStateWithTipStandard,
  getInitialRobotStateWithOffDeckLabwareStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from '../fixtures'
import type { InvariantContext, RobotState } from '../types'

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

describe('moveToWell', () => {
  let robotStateWithTip: RobotState
  let invariantContext: InvariantContext
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should return a moveToWell command given only the required params', () => {
    const params = {
      pipette: DEFAULT_PIPETTE,
      labware: SOURCE_LABWARE,
      well: 'A1',
    }
    const result = moveToWell(params, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveToWell',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          labwareId: SOURCE_LABWARE,
          wellName: 'A1',
        },
      },
    ])
  })
  it('should apply the optional params to the command', () => {
    const params = {
      pipette: DEFAULT_PIPETTE,
      labware: SOURCE_LABWARE,
      well: 'A1',
      offset: {
        x: 1,
        y: 2,
        z: 3,
      },
      minimumZHeight: 5,
      forceDirect: true,
    }
    const result = moveToWell(params, invariantContext, robotStateWithTip)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveToWell',
        key: expect.any(String),
        params: {
          pipetteId: DEFAULT_PIPETTE,
          labwareId: SOURCE_LABWARE,
          wellName: 'A1',
          wellLocation: {
            origin: 'bottom',
            offset: {
              x: 1,
              y: 2,
              z: 3,
            },
          },
          minimumZHeight: 5,
          forceDirect: true,
        },
      },
    ])
  })
  it('should return an error if pipette does not exist', () => {
    const result = moveToWell(
      {
        pipette: 'badPipette',
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expectTimelineError(getErrorResult(result).errors, 'PIPETTE_DOES_NOT_EXIST')
  })
  it('should return error if labware does not exist', () => {
    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: 'problematicLabwareId',
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })
  it('should return an error when dispensing from labware off deck', () => {
    const initialRobotState = getInitialRobotStateWithOffDeckLabwareStandard(
      invariantContext
    )
    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      initialRobotState
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_OFF_DECK',
    })
  })
  it('should return an error when dispensing from the 4th column', () => {
    robotStateWithTip = {
      ...robotStateWithTip,
      labware: {
        [SOURCE_LABWARE]: { slot: 'A4' },
      },
    }
    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'PIPETTING_INTO_COLUMN_4',
    })
  })
  it('should return an error when moving to well in a thermocycler with pipette collision', () => {
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
    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'THERMOCYCLER_LID_CLOSED',
    })
  })

  it('should return an error when moving to well in a heater-shaker with latch opened', () => {
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
    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_LATCH_OPEN',
    })
  })

  it('should return an error when moving to well in a heater-shaker with latch opened for flex', () => {
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
    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_LATCH_OPEN',
    })
  })

  it('should return an error when moving to well in a heater-shaker latch is opened but is not shaking', () => {
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
    mockPipetteIntoHeaterShakerWhileShaking.mockImplementationOnce(
      (
        modules: RobotState['modules'],
        labware: RobotState['labware'],
        labwareId: string
      ) => {
        expect(modules).toBe(robotStateWithTip.modules)
        expect(labware).toBe(robotStateWithTip.labware)
        expect(labwareId).toBe(SOURCE_LABWARE)
        return false
      }
    )

    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_LATCH_OPEN',
    })
  })

  it('should return an error when moving to well in a heater-shaker is shaking but latch is closed', () => {
    mockPipetteIntoHeaterShakerLatchOpen.mockImplementationOnce(
      (
        modules: RobotState['modules'],
        labware: RobotState['labware'],
        labwareId: string
      ) => {
        expect(modules).toBe(robotStateWithTip.modules)
        expect(labware).toBe(robotStateWithTip.labware)
        expect(labwareId).toBe(SOURCE_LABWARE)
        return false
      }
    )
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

    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_IS_SHAKING',
    })
  })

  it('should return an error when moving to well in a heater-shaker is shaking but latch is closed for flex', () => {
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
        return false
      }
    )
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

    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_IS_SHAKING',
    })
  })

  //  we should never run into this because you should not be allowed to shake when the latch is opened
  it('should return 2 errors when moving to well in a heater-shaker that is shaking and latch open', () => {
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

    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(2)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_LATCH_OPEN',
    })
    expect(getErrorResult(result).errors[1]).toMatchObject({
      type: 'HEATER_SHAKER_IS_SHAKING',
    })
  })
  it('should return an error when moving to a well east/west of a heater shaker with its latch open', () => {
    when(mockGetIsHeaterShakerEastWestWithLatchOpen)
      .calledWith(
        robotStateWithTip.modules,
        robotStateWithTip.labware[SOURCE_LABWARE].slot
      )
      .mockReturnValue(true)

    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_EAST_WEST_LATCH_OPEN',
    })
  })
  it('should return an error when moving to a well east/west of a heater shaker with a multi channel pipette', () => {
    when(mockGetIsHeaterShakerEastWestMultiChannelPipette)
      .calledWith(
        robotStateWithTip.modules,
        robotStateWithTip.labware[SOURCE_LABWARE].slot,
        expect.anything()
      )
      .mockReturnValue(true)

    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_EAST_WEST_MULTI_CHANNEL',
    })
  })
  it('should return an error when moving to a well north/south/east/west of a heater shaker while it is shaking', () => {
    when(mockPipetteAdjacentHeaterShakerWhileShaking)
      .calledWith(
        robotStateWithTip.modules,
        robotStateWithTip.labware[SOURCE_LABWARE].slot
      )
      .mockReturnValue(true)

    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_NORTH_SOUTH_EAST_WEST_SHAKING',
    })
  })
  it('should return an error when moving to labware north/south of a heater shaker into a non tiprack using a multi channel pipette', () => {
    when(mockGetIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette)
      .calledWith(
        robotStateWithTip.modules,
        robotStateWithTip.labware[SOURCE_LABWARE].slot,
        expect.anything(),
        expect.anything()
      )
      .mockReturnValue(true)

    const result = moveToWell(
      {
        pipette: DEFAULT_PIPETTE,
        labware: SOURCE_LABWARE,
        well: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_NORTH_SOUTH__OF_NON_TIPRACK_WITH_MULTI_CHANNEL',
    })
  })
})
