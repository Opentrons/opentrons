import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getPipetteSpecsV2, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { expectTimelineError } from '../../../__utils__/testMatchers'
import {
  DEFAULT_PIPETTE,
  getErrorResult,
  getInitialRobotStateWithOffDeckLabwareStandard,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
  SOURCE_LABWARE,
} from '../../../fixtures'
import {
  absorbanceReaderCollision,
  getIsHeaterShakerEastWestMultiChannelPipette,
  getIsHeaterShakerEastWestWithLatchOpen,
  getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette,
  getSlotInLocationStack,
  pipetteAdjacentHeaterShakerWhileShaking,
  pipetteIntoHeaterShakerLatchOpen,
  pipetteIntoHeaterShakerWhileShaking,
  thermocyclerPipetteCollision,
} from '../../../utils'
import { moveToWell } from '../moveToWell'

import type { WellOrigin } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

vi.mock('../../../utils/absorbanceReaderCollision')
vi.mock('../../../utils/thermocyclerPipetteCollision')
vi.mock('../../../utils/heaterShakerCollision')

const FLEX_PIPETTE = 'p1000_single_flex'
const FlexPipetteNameSpecs = getPipetteSpecsV2(FLEX_PIPETTE)

describe('moveToWell', () => {
  let robotStateWithTip: RobotState
  let invariantContext: InvariantContext
  beforeEach(() => {
    invariantContext = makeContext()
    robotStateWithTip = getRobotStateWithTipStandard(invariantContext)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should return a moveToWell command given only the required params', () => {
    const params = {
      pipetteId: DEFAULT_PIPETTE,
      labwareId: SOURCE_LABWARE,
      wellName: 'A1',
      wellLocation: {
        origin: 'bottom' as WellOrigin,
        offset: { z: 1 },
      },
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
            origin: 'bottom' as any,
            offset: {
              z: 1,
            },
          },
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      'mock_pipette.move_to(mock_source_plate["A1"].bottom(z=1))'
    )
  })
  it('should apply the optional params to the command', () => {
    const params = {
      pipetteId: DEFAULT_PIPETTE,
      labwareId: SOURCE_LABWARE,
      wellName: 'A1',
      wellLocation: {
        origin: 'bottom' as any,
        offset: {
          x: 1,
          y: 2,
          z: 3,
        },
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
    expect(getSuccessResult(result).python).toBe(
      'mock_pipette.move_to(mock_source_plate["A1"].bottom(z=3).move(types.Point(x=1, y=2)), force_direct=True, minimum_z_height=5)'
    )
  })
  it('should return an error if pipette does not exist', () => {
    const result = moveToWell(
      {
        pipetteId: 'badPipette',
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expectTimelineError(getErrorResult(result).errors, 'PIPETTE_DOES_NOT_EXIST')
  })
  it('should return error if labware does not exist', () => {
    const result = moveToWell(
      {
        pipetteId: DEFAULT_PIPETTE,
        labwareId: 'problematicLabwareId',
        wellName: 'A1',
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
    const initialRobotState =
      getInitialRobotStateWithOffDeckLabwareStandard(invariantContext)
    const result = moveToWell(
      {
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
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
        [SOURCE_LABWARE]: { stack: [SOURCE_LABWARE, 'A4'] },
      },
    }
    const result = moveToWell(
      {
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
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
    vi.mocked(thermocyclerPipetteCollision).mockImplementationOnce(
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
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'THERMOCYCLER_LID_CLOSED',
    })
  })
  it('should return an error when moving to well in a absorbance reader with pipette collision', () => {
    vi.mocked(absorbanceReaderCollision).mockImplementationOnce(
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
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'ABSORBANCE_READER_LID_CLOSED',
    })
  })

  it('should return an error when moving to well in a heater-shaker with latch opened', () => {
    vi.mocked(pipetteIntoHeaterShakerLatchOpen).mockImplementationOnce(
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
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
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
      invariantContext.pipetteEntities[DEFAULT_PIPETTE].spec =
        FlexPipetteNameSpecs
    }

    vi.mocked(pipetteIntoHeaterShakerLatchOpen).mockImplementationOnce(
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
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
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
    vi.mocked(pipetteIntoHeaterShakerLatchOpen).mockImplementationOnce(
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
    vi.mocked(pipetteIntoHeaterShakerWhileShaking).mockImplementationOnce(
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
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
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
    vi.mocked(pipetteIntoHeaterShakerLatchOpen).mockImplementationOnce(
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
    vi.mocked(pipetteIntoHeaterShakerWhileShaking).mockImplementationOnce(
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
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
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
      invariantContext.pipetteEntities[DEFAULT_PIPETTE].spec =
        FlexPipetteNameSpecs
    }

    vi.mocked(pipetteIntoHeaterShakerLatchOpen).mockImplementationOnce(
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
    vi.mocked(pipetteIntoHeaterShakerWhileShaking).mockImplementationOnce(
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
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
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
    vi.mocked(pipetteIntoHeaterShakerLatchOpen).mockImplementationOnce(
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
    vi.mocked(pipetteIntoHeaterShakerWhileShaking).mockImplementationOnce(
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
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
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
    vi.when(getIsHeaterShakerEastWestWithLatchOpen)
      .calledWith(
        robotStateWithTip.modules,
        getSlotInLocationStack(robotStateWithTip.labware[SOURCE_LABWARE].stack)
      )
      .thenReturn(true)

    const result = moveToWell(
      {
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
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
    vi.when(getIsHeaterShakerEastWestMultiChannelPipette)
      .calledWith(
        robotStateWithTip.modules,
        getSlotInLocationStack(robotStateWithTip.labware[SOURCE_LABWARE].stack),
        expect.anything()
      )
      .thenReturn(true)

    const result = moveToWell(
      {
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
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
    vi.when(pipetteAdjacentHeaterShakerWhileShaking)
      .calledWith(
        robotStateWithTip.modules,
        getSlotInLocationStack(robotStateWithTip.labware[SOURCE_LABWARE].stack),
        OT2_ROBOT_TYPE
      )
      .thenReturn(true)

    const result = moveToWell(
      {
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
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
    vi.when(getIsHeaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette)
      .calledWith(
        robotStateWithTip.modules,
        getSlotInLocationStack(robotStateWithTip.labware[SOURCE_LABWARE].stack),
        expect.anything(),
        expect.anything()
      )
      .thenReturn(true)

    const result = moveToWell(
      {
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_NORTH_SOUTH__OF_NON_TIPRACK_WITH_MULTI_CHANNEL',
    })
  })
  it('resolves every arg when they are runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: DEFAULT_PIPETTE,
      },
      selected_labware: {
        variableName: 'selected_labware',
        displayName: 'Selected labware',
        type: 'string',
        default: SOURCE_LABWARE,
      },
      well_name: {
        variableName: 'well_name',
        displayName: 'Well name',
        type: 'string',
        default: 'A1',
      },
      well_origin: {
        variableName: 'well_origin',
        displayName: 'Well origin',
        type: 'string',
        default: 'bottom',
      },
      offset_x: {
        variableName: 'offset_x',
        displayName: 'Offset x',
        type: 'int',
        default: 1,
      },
      offset_y: {
        variableName: 'offset_y',
        displayName: 'Offset y',
        type: 'float',
        default: 2,
      },
      offset_z: {
        variableName: 'offset_z',
        displayName: 'Offset z',
        type: 'float',
        default: 3,
      },
      force_direct: {
        variableName: 'force_direct',
        displayName: 'Force direct',
        type: 'boolean',
        default: false,
      },
      min_z: {
        variableName: 'min_z',
        displayName: 'Min z',
        type: 'float',
        default: 5,
      },
      move_speed: {
        variableName: 'move_speed',
        displayName: 'Move speed',
        type: 'int',
        default: 10,
      },
    }
    const result = moveToWell(
      {
        pipetteId: 'selected_pipette',
        labwareId: 'selected_labware',
        wellName: 'well_name',
        wellLocation: {
          origin: 'well_origin',
          offset: { x: 'offset_x', y: 'offset_y', z: 'offset_z' },
        },
        forceDirect: 'force_direct',
        minimumZHeight: 'min_z',
        speed: 'move_speed',
      },
      invariantContext,
      robotStateWithTip
    )
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
            offset: { x: 1, y: 2, z: 3 },
          },
          forceDirect: false,
          minimumZHeight: 5,
          speed: 10,
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      'mock_pipette.move_to(mock_source_plate[well_name].bottom(z=offset_z).move(types.Point(x=offset_x, y=offset_y)), force_direct=force_direct, minimum_z_height=min_z, speed=move_speed)'
    )
  })
  it('returns errors if args are not valid runtime parameters', () => {
    invariantContext.runtimeParameters = {
      mock_bool_rtp: {
        variableName: 'mock_bool_rtp',
        displayName: 'mock bool rtp',
        type: 'boolean',
        default: false,
      },
      mock_int_rtp: {
        variableName: 'mock_int_rtp',
        displayName: 'mock int rtp',
        type: 'int',
        default: 1,
      },
      mock_string_rtp: {
        variableName: 'mock_string_rtp',
        displayName: 'mock string rtp',
        type: 'string',
        default: 'mock',
      },
    }
    const result = moveToWell(
      {
        pipetteId: 'mock_bool_rtp',
        labwareId: 'mock_int_rtp',
        wellName: 'mock_bool_rtp',
        wellLocation: {
          origin: 'mock_int_rtp',
          offset: {
            x: 'mock_string_rtp',
            y: 'missing_offset',
            z: 'mock_bool_rtp',
          },
        },
        minimumZHeight: 'mock_string_rtp',
        forceDirect: 'mock_int_rtp',
        speed: 'mock_bool_rtp',
      },
      invariantContext,
      robotStateWithTip
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_bool_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_int_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_bool_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_int_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "missing_offset" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_bool_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_int_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_bool_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
