import {
  HEATERSHAKER_MODULE_TYPE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import {
  getInitialRobotStateStandard,
  getInitialRobotStateWithOffDeckLabwareStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  getStateAndContextTempTCModules,
  SOURCE_LABWARE,
  TIPRACK_1,
} from '../fixtures'
import { moveLabware, MoveLabwareArgs } from '..'

import type { InvariantContext, RobotState } from '../types'

const mockWasteChuteId = 'mockWasteChuteId'
const mockGripperId = 'mockGripperId'

describe('moveLabware', () => {
  let robotState: RobotState
  let invariantContext: InvariantContext
  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)

    invariantContext = {
      ...invariantContext,
      additionalEquipmentEntities: {
        mockGripperId: {
          name: 'gripper',
          id: mockGripperId,
        },
      },
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should return a moveLabware command for manualMoveWithPause given only the required params', () => {
    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: SOURCE_LABWARE,
      useGripper: false,
      newLocation: { slotName: 'A1' },
    } as MoveLabwareArgs

    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveLabware',
        key: expect.any(String),
        params: {
          labwareId: SOURCE_LABWARE,
          strategy: 'manualMoveWithPause',
          newLocation: { slotName: 'A1' },
        },
      },
    ])
  })
  it('should return a moveLabware command for moving with a gripper given only the required params', () => {
    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: SOURCE_LABWARE,
      useGripper: true,
      newLocation: { slotName: 'A1' },
    } as MoveLabwareArgs

    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveLabware',
        key: expect.any(String),
        params: {
          labwareId: SOURCE_LABWARE,
          strategy: 'usingGripper',
          newLocation: { slotName: 'A1' },
        },
      },
    ])
  })
  it('should return an error for labware does not exist with bad labwareid', () => {
    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: 'badLabware',
      useGripper: true,
      newLocation: { slotName: 'A1' },
    } as MoveLabwareArgs

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })
  it('should return an error for trying to move the labware back onto deck when off deck currently with gripper', () => {
    robotState = getInitialRobotStateWithOffDeckLabwareStandard(
      invariantContext
    )
    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: SOURCE_LABWARE,
      useGripper: true,
      newLocation: { slotName: 'A1' },
    } as MoveLabwareArgs

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_OFF_DECK',
    })
  })
  it('should return an error for trying to move the labware off deck with a gripper', () => {
    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: SOURCE_LABWARE,
      useGripper: true,
      newLocation: 'offDeck',
    } as MoveLabwareArgs

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_OFF_DECK',
    })
  })
  it('should return an error when trying to move labware to the thermocycler when lid is closed', () => {
    const temperatureModuleId = 'temperatureModuleId'
    const thermocyclerId = 'thermocyclerId'

    const stateAndContext = getStateAndContextTempTCModules({
      temperatureModuleId,
      thermocyclerId,
    })
    const tcInvariantContext = stateAndContext.invariantContext
    const tcRobotState = stateAndContext.robotState

    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: SOURCE_LABWARE,
      useGripper: false,
      newLocation: { moduleId: thermocyclerId },
    } as MoveLabwareArgs

    const result = moveLabware(params, tcInvariantContext, tcRobotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'THERMOCYCLER_LID_CLOSED',
    })
  })
  it('should return an error when trying to move labware to the heater-shaker when its latch is closed', () => {
    const state = getInitialRobotStateStandard(invariantContext)
    const HEATER_SHAKER_ID = 'heaterShakerId'
    const HEATER_SHAKER_SLOT = 'A1'

    robotState = {
      ...state,
      modules: {
        ...state.modules,
        [HEATER_SHAKER_ID]: {
          slot: HEATER_SHAKER_SLOT,
          moduleState: {
            type: HEATERSHAKER_MODULE_TYPE,
            latchOpen: false,
            targetSpeed: null,
          },
        } as any,
      },
    }
    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: SOURCE_LABWARE,
      useGripper: true,
      newLocation: { moduleId: HEATER_SHAKER_ID },
    } as MoveLabwareArgs

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_LATCH_CLOSED',
    })
  })
  it('should return an error when trying to move labware to an adapter on the heater-shaker when its latch is closed', () => {
    const state = getInitialRobotStateStandard(invariantContext)
    const HEATER_SHAKER_ID = 'heaterShakerId'
    const HEATER_SHAKER_SLOT = 'A1'
    const ADAPTER_ID = 'adapterId'

    robotState = {
      ...state,
      labware: {
        ...state.labware,
        [ADAPTER_ID]: {
          slot: HEATER_SHAKER_ID,
        },
      },
      modules: {
        ...state.modules,
        [HEATER_SHAKER_ID]: {
          slot: HEATER_SHAKER_SLOT,
          moduleState: {
            type: HEATERSHAKER_MODULE_TYPE,
            latchOpen: false,
            targetSpeed: null,
          },
        } as any,
      },
    }
    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: SOURCE_LABWARE,
      useGripper: true,
      newLocation: { labwareId: ADAPTER_ID },
    } as MoveLabwareArgs

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_LATCH_CLOSED',
    })
  })
  it('should return an error when trying to move labware to the heater-shaker when its shaking', () => {
    const state = getInitialRobotStateStandard(invariantContext)
    const HEATER_SHAKER_ID = 'heaterShakerId'
    const HEATER_SHAKER_SLOT = 'A1'

    robotState = {
      ...state,
      modules: {
        ...state.modules,
        [HEATER_SHAKER_ID]: {
          slot: HEATER_SHAKER_SLOT,
          moduleState: {
            type: HEATERSHAKER_MODULE_TYPE,
            latchOpen: true,
            targetSpeed: 400,
          },
        } as any,
      },
    }
    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: SOURCE_LABWARE,
      useGripper: true,
      newLocation: { moduleId: HEATER_SHAKER_ID },
    } as MoveLabwareArgs

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_IS_SHAKING',
    })
  })
  it('should return a warning for if you try to move a tiprack with tips into the waste chute', () => {
    const wasteChuteInvariantContext = {
      ...invariantContext,
      additionalEquipmentEntities: {
        ...invariantContext.additionalEquipmentEntities,
        mockWasteChuteId: {
          name: 'wasteChute',
          id: mockWasteChuteId,
          location: WASTE_CHUTE_CUTOUT,
        },
      },
    } as InvariantContext

    const robotStateWithTip = ({
      ...robotState,
      tipState: {
        tipracks: {
          tiprack1Id: { A1: true },
        },
      },
    } as any) as RobotState
    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: TIPRACK_1,
      useGripper: true,
      newLocation: { addressableAreaName: 'gripperWasteChute' },
    } as MoveLabwareArgs

    const result = moveLabware(
      params,
      wasteChuteInvariantContext,
      robotStateWithTip
    )
    expect(result.warnings).toEqual([
      {
        message: 'Disposing of a tiprack with tips',
        type: 'TIPRACK_IN_WASTE_CHUTE_HAS_TIPS',
      },
    ])
  })
  it('should return a warning for if you try to move a labware with liquids into the waste chute', () => {
    const wasteChuteInvariantContext = {
      ...invariantContext,
      additionalEquipmentEntities: {
        ...invariantContext.additionalEquipmentEntities,
        mockWasteChuteId: {
          name: 'wasteChute',
          id: mockWasteChuteId,
          location: WASTE_CHUTE_CUTOUT,
        },
      },
    } as InvariantContext
    const robotStateWithLiquid = ({
      ...robotState,
      liquidState: {
        labware: {
          sourcePlateId: { A1: { ingredGroup: { volume: 10 } } },
        },
      },
    } as any) as RobotState
    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: SOURCE_LABWARE,
      useGripper: true,
      newLocation: { addressableAreaName: 'gripperWasteChute' },
    } as MoveLabwareArgs

    const result = moveLabware(
      params,
      wasteChuteInvariantContext,
      robotStateWithLiquid
    )
    expect(result.warnings).toEqual([
      {
        message: 'Disposing of a labware with liquid',
        type: 'LABWARE_IN_WASTE_CHUTE_HAS_LIQUID',
      },
    ])
  })
  it('should return an error when trying to move with gripper when there is no gripper', () => {
    invariantContext = {
      ...invariantContext,
      additionalEquipmentEntities: {},
    } as InvariantContext

    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: SOURCE_LABWARE,
      useGripper: true,
      newLocation: { slotName: 'A1' },
    } as MoveLabwareArgs

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'GRIPPER_REQUIRED',
    })
  })
  it('should return an error when trying to move into the waste chute when useGripper is not selected', () => {
    invariantContext = {
      ...invariantContext,
      additionalEquipmentEntities: {
        ...invariantContext.additionalEquipmentEntities,
        mockWasteChuteId: {
          name: 'wasteChute',
          id: mockWasteChuteId,
          location: WASTE_CHUTE_CUTOUT,
        },
      },
    } as InvariantContext

    const params = {
      commandCreatorFnName: 'moveLabware',
      labware: SOURCE_LABWARE,
      useGripper: false,
      newLocation: { addressableAreaName: 'gripperWasteChute' },
    } as MoveLabwareArgs

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'GRIPPER_REQUIRED',
    })
  })
})
