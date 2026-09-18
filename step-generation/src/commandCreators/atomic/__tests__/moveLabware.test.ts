import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixture12Trough,
  fixtureTiprackAdapter,
  HEATERSHAKER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
  VACUUM_MODULE_V1,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'

import { moveLabware } from '..'
import {
  DEST_LABWARE,
  getErrorResult,
  getInitialRobotStateStandard,
  getInitialRobotStateWithOffDeckLabwareStandard,
  getStateAndContextTempTCModules,
  getSuccessResult,
  makeContext,
  SOURCE_LABWARE,
  TIPRACK_1,
} from '../../../fixtures'
import { TIPRACK_LID_LOADNAME } from '../moveLabware'

import type {
  LabwareDefinition2,
  MoveLabwareParams,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

const mockWasteChuteId = 'mockWasteChuteId'
const mockTrashBinId = 'mockTrashBinId'
const mockStagingAreaId = 'mockStagingAreaId'
describe('moveLabware', () => {
  let robotState: RobotState
  let invariantContext: InvariantContext
  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)

    invariantContext = {
      ...invariantContext,
      trashBinEntities: {
        mockTrashBinId: {
          id: mockTrashBinId,
          pythonName: 'mock_trash_bin_1',
          location: 'cutoutA3',
        },
      },
      wasteChuteEntities: {},
      gripperEntities: {
        mockGripperId: {
          id: 'mockGripperId',
        },
      },
      stagingAreaEntities: {
        mockStagingAreaId: {
          id: mockStagingAreaId,
          location: 'A4',
        },
      },
    }
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should return a moveLabware command moving to a 4th column slot', () => {
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'manualMoveWithPause',
      newLocation: { addressableAreaName: 'A4' },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveLabware',
        key: expect.any(String),
        params: {
          labwareId: SOURCE_LABWARE,
          strategy: 'manualMoveWithPause',
          newLocation: { addressableAreaName: 'A4' },
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_labware(mock_source_plate, "A4")`
    )
  })
  it('should return a moveLabware command moving to a trash bin for an ot-2', () => {
    invariantContext = {
      ...invariantContext,
      trashBinEntities: {
        mockTrashBinId: {
          id: mockTrashBinId,
          pythonName: 'mock_trash_bin_1',
          location: 'cutout12',
        },
      },
    }

    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'manualMoveWithPause',
      newLocation: { addressableAreaName: 'fixedTrash' },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveLabware',
        key: expect.any(String),
        params: {
          labwareId: SOURCE_LABWARE,
          strategy: 'manualMoveWithPause',
          newLocation: { addressableAreaName: 'fixedTrash' },
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_labware(mock_source_plate, mock_trash_bin_1)`
    )
  })
  it('should return a moveLabware command moving to a trash bin for flex', () => {
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'manualMoveWithPause',
      newLocation: { addressableAreaName: 'movableTrashA3' },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveLabware',
        key: expect.any(String),
        params: {
          labwareId: SOURCE_LABWARE,
          strategy: 'manualMoveWithPause',
          newLocation: { addressableAreaName: 'movableTrashA3' },
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_labware(mock_source_plate, mock_trash_bin_1)`
    )
  })
  it('should return a moveLabware command moving to a module', () => {
    const state = getInitialRobotStateStandard(invariantContext)
    const HEATER_SHAKER_ID = 'heaterShakerId'
    const HEATER_SHAKER_SLOT = 'A1'

    invariantContext = {
      ...invariantContext,
      moduleEntities: {
        [HEATER_SHAKER_ID]: {
          pythonName: 'mock_heater_shaker_1',
        } as any,
      },
    }
    robotState = {
      ...state,
      modules: {
        ...state.modules,
        [HEATER_SHAKER_ID]: {
          pythonName: 'mock_heater_shaker_1',
          slot: HEATER_SHAKER_SLOT,
          moduleState: {
            type: HEATERSHAKER_MODULE_TYPE,
            latchOpen: true,
            targetSpeed: null,
          },
        } as any,
      },
    }
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { moduleId: HEATER_SHAKER_ID },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveLabware',
        key: expect.any(String),
        params: {
          labwareId: SOURCE_LABWARE,
          strategy: 'usingGripper',
          newLocation: { moduleId: HEATER_SHAKER_ID },
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_labware(mock_source_plate, mock_heater_shaker_1, use_gripper=True)`
    )
  })
  it('should return a moveLabware command moving to an adapter', () => {
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'manualMoveWithPause',
      newLocation: { labwareId: DEST_LABWARE },
    } as MoveLabwareParams

    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        ...invariantContext.labwareEntities,
        [SOURCE_LABWARE]: {
          ...invariantContext.labwareEntities[SOURCE_LABWARE],
          pythonName: 'mock_source_plate',
          def: {
            ...invariantContext.labwareEntities[SOURCE_LABWARE].def,
            compatibleParentLabware: ['fixture_flex_96_tiprack_adapter'],
          } as LabwareDefinition2,
        },
        [DEST_LABWARE]: {
          def: fixtureTiprackAdapter as LabwareDefinition2,
          pythonName: 'mock_dest_adapter',
        } as any,
      },
    }
    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveLabware',
        key: expect.any(String),
        params: {
          labwareId: SOURCE_LABWARE,
          strategy: 'manualMoveWithPause',
          newLocation: { labwareId: DEST_LABWARE },
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_labware(mock_source_plate, mock_dest_adapter)`
    )
  })
  it('should return a moveLabware command moving manually off-deck', () => {
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'manualMoveWithPause',
      newLocation: 'offDeck',
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveLabware',
        key: expect.any(String),
        params: {
          labwareId: SOURCE_LABWARE,
          strategy: 'manualMoveWithPause',
          newLocation: 'offDeck',
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_labware(mock_source_plate, protocol_api.OFF_DECK)`
    )
  })
  it('should return a moveLabware command for manualMoveWithPause given only the required params', () => {
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'manualMoveWithPause',
      newLocation: { slotName: 'A1' },
    } as MoveLabwareParams

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
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_labware(mock_source_plate, "A1")`
    )
  })
  it('should return a moveLabware command for moving with a gripper given only the required params', () => {
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { slotName: 'A1' },
    } as MoveLabwareParams

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
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_labware(mock_source_plate, "A1", use_gripper=True)`
    )
  })
  it('should return an error for labware does not exist with bad labwareid', () => {
    const params = {
      labwareId: 'badLabware',
      strategy: 'usingGripper',
      newLocation: { slotName: 'A1' },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })
  it('should return an error for trying to move the labware back onto deck when off deck currently with gripper', () => {
    robotState =
      getInitialRobotStateWithOffDeckLabwareStandard(invariantContext)
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { slotName: 'A1' },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_OFF_DECK',
    })
  })
  it('should return an error for trying to move the labware to an occupied slot', () => {
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { slotName: '1' },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_ON_ANOTHER_ENTITY',
    })
  })
  it('should not return an error for trying to move the labware to an occupied slot where the labware supports stacking', () => {
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { slotName: '1' },
    } as MoveLabwareParams

    robotState = {
      ...robotState,
      ...robotState.labware,
      labware: {
        [SOURCE_LABWARE]: {
          stack: [SOURCE_LABWARE, '2'],
        },
        stackingLabware: {
          stack: ['stackingLabware', '1'],
        },
      },
    }
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        ...invariantContext.labwareEntities,
        [SOURCE_LABWARE]: {
          ...invariantContext.labwareEntities[SOURCE_LABWARE],
          def: {
            ...invariantContext.labwareEntities[SOURCE_LABWARE].def,
            compatibleParentLabware: ['fixture_12_trough'],
          } as LabwareDefinition2,
          pythonName: 'mock_source_plate',
        },
        stackingLabware: {
          def: {
            ...fixture12Trough,
          } as LabwareDefinition2,
        } as any,
      },
    }
    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).commands).toEqual([
      {
        commandType: 'moveLabware',
        key: expect.any(String),
        params: {
          labwareId: SOURCE_LABWARE,
          strategy: 'usingGripper',
          newLocation: { slotName: '1' },
        },
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_labware(mock_source_plate, "1", use_gripper=True)`
    )
  })
  it('should return an error for trying to move the labware to an occupied module', () => {
    const state = getInitialRobotStateStandard(invariantContext)
    const HEATER_SHAKER_ID = 'heaterShakerId'
    const HEATER_SHAKER_SLOT = 'A1'

    robotState = {
      ...state,
      labware: {
        ...state.labware,
        mockLabwareId: {
          stack: ['mockLabwareId', HEATER_SHAKER_ID, HEATER_SHAKER_SLOT],
        },
      },
      modules: {
        ...state.modules,
        [HEATER_SHAKER_ID]: {
          ...state.modules[HEATER_SHAKER_ID],
          slot: HEATER_SHAKER_SLOT,
          moduleState: {
            type: HEATERSHAKER_MODULE_TYPE,
            latchOpen: true,
            targetSpeed: null,
            targetTemp: null,
          },
        },
      },
    }
    invariantContext = {
      ...invariantContext,
      moduleEntities: {
        [HEATER_SHAKER_ID]: {
          model: 'heaterShakerModuleV1',
          id: HEATER_SHAKER_ID,
          type: 'heaterShakerModuleType',
          pythonName: 'mock_heater_shaker',
        },
      },
      labwareEntities: {
        ...invariantContext.labwareEntities,
        mockLabwareId: {
          def: fixture12Trough as LabwareDefinition2,
        } as any,
      },
    }
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { moduleId: HEATER_SHAKER_ID },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_ON_ANOTHER_ENTITY',
    })
  })
  it('should return an error for the labware already being discarded in previous step in a waste chute', () => {
    const wasteChuteInvariantContext = {
      ...invariantContext,
      wasteChuteEntities: {
        ...invariantContext.wasteChuteEntities,
        mockWasteChuteId: {
          pythonName: 'waste_chute',
          id: mockWasteChuteId,
          location: WASTE_CHUTE_CUTOUT,
        },
      },
    } as InvariantContext

    robotState.labware = {
      [SOURCE_LABWARE]: { stack: [SOURCE_LABWARE, 'gripperWasteChute'] },
    }
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { slotName: 'A1' },
    } as MoveLabwareParams

    const result = moveLabware(params, wasteChuteInvariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_DISCARDED_IN_TRASH',
    })
  })
  it('should return an error for trying to move the labware off deck with a gripper', () => {
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: 'offDeck',
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'LABWARE_OFF_DECK',
    })
  })
  it('should return an error for trying to move an aluminum block with a gripper', () => {
    const aluminumBlockDef = {
      metadata: { displayCategory: 'aluminumBlock' },
      parameters: { loadName: 'mockAluminumBlockLoadName' },
    } as any as LabwareDefinition2

    invariantContext = {
      ...invariantContext,
      gripperEntities: {
        mockGripperId: {
          id: 'mockGripperId',
        },
      },
      labwareEntities: {
        [SOURCE_LABWARE]: {
          id: 'labwareid',
          labwareDefURI: 'mockDefUri',
          def: aluminumBlockDef,
          pythonName: 'mock_alumnium_block',
        },
      },
    }

    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { slotName: 'A1' },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'CANNOT_MOVE_WITH_GRIPPER',
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
      labwareId: SOURCE_LABWARE,
      strategy: 'manualMoveWithPause',
      newLocation: { moduleId: thermocyclerId },
    } as MoveLabwareParams

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

    invariantContext = {
      ...invariantContext,
      moduleEntities: {
        [HEATER_SHAKER_ID]: {
          ...invariantContext.moduleEntities[HEATER_SHAKER_ID],
          pythonName: 'mock_heater_shaker',
        },
      },
    }

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
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { moduleId: HEATER_SHAKER_ID },
    } as MoveLabwareParams

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

    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        ...invariantContext.labwareEntities,
        [ADAPTER_ID]: {
          ...invariantContext.labwareEntities[ADAPTER_ID],
          def: {
            metadata: { displayCategory: 'wellPlate' },
            parameters: {
              loadName: 'opentrons_96_wellplate_200ul_pcr_full_skirt',
            },
          } as LabwareDefinition2,
          pythonName: 'mock_adapter',
        },
      },
    }

    robotState = {
      ...state,
      labware: {
        ...state.labware,
        [ADAPTER_ID]: {
          stack: [ADAPTER_ID, HEATER_SHAKER_ID, HEATER_SHAKER_SLOT],
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
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { labwareId: ADAPTER_ID },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    // expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_LATCH_CLOSED',
    })
  })
  it('should return an error when trying to move labware to the heater-shaker when its shaking', () => {
    const state = getInitialRobotStateStandard(invariantContext)
    const HEATER_SHAKER_ID = 'heaterShakerId'
    const HEATER_SHAKER_SLOT = 'A1'

    invariantContext = {
      ...invariantContext,
      moduleEntities: {
        [HEATER_SHAKER_ID]: {
          ...invariantContext.moduleEntities[HEATER_SHAKER_ID],
          pythonName: 'mock_heater_shaker',
        },
      },
    }

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
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { moduleId: HEATER_SHAKER_ID },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'HEATER_SHAKER_IS_SHAKING',
    })
  })
  it('should return a warning for if you try to move a tiprack with tips into the waste chute', () => {
    const wasteChuteInvariantContext = {
      ...invariantContext,
      wasteChuteEntities: {
        mockWasteChuteId: {
          id: mockWasteChuteId,
          location: WASTE_CHUTE_CUTOUT,
          pythonName: 'waste_chute',
        },
      },
    } as InvariantContext

    const robotStateWithTip = {
      ...robotState,
      tipState: {
        tipracks: {
          tiprack1Id: { A1: { hasTip: true } },
        },
        pipettes: {
          p10SingleId: false,
        },
      },
    } as any as RobotState
    const params = {
      labwareId: TIPRACK_1,
      strategy: 'usingGripper',
      newLocation: { addressableAreaName: 'gripperWasteChute' },
    } as MoveLabwareParams

    const result = moveLabware(
      params,
      wasteChuteInvariantContext,
      robotStateWithTip
    )
    expect(result.warnings).toEqual([
      {
        message: 'Disposing unused tips',
        type: 'TIPRACK_IN_WASTE_CHUTE_HAS_TIPS',
      },
    ])
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_labware(mock_tip_rack_1, waste_chute, use_gripper=True)`
    )
  })
  it('should return a warning for if you try to move a labware with liquids into the waste chute', () => {
    const wasteChuteInvariantContext = {
      ...invariantContext,
      wasteChuteEntities: {
        mockWasteChuteId: {
          id: mockWasteChuteId,
          location: WASTE_CHUTE_CUTOUT,
          pythonName: 'waste_chute',
        },
      },
    } as InvariantContext
    const robotStateWithLiquid = {
      ...robotState,
      liquidState: {
        labware: {
          sourcePlateId: { A1: { ingredGroup: { volume: 10 } } },
        },
      },
    } as any as RobotState
    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { addressableAreaName: 'gripperWasteChute' },
    } as MoveLabwareParams

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
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_labware(mock_source_plate, waste_chute, use_gripper=True)`
    )
  })
  it('should return an error when trying to move with gripper when there is no gripper', () => {
    invariantContext = {
      ...invariantContext,
      gripperEntities: {},
    } as InvariantContext

    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { slotName: 'A1' },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'GRIPPER_REQUIRED',
    })
  })
  it('should return an error when trying to move into the waste chute when useGripper is not selected', () => {
    invariantContext = {
      ...invariantContext,
      wasteChuteEntities: {
        mockWasteChuteId: {
          pythonName: 'wate_chute',
          id: mockWasteChuteId,
          location: WASTE_CHUTE_CUTOUT,
        },
      },
    } as InvariantContext

    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'manualMoveWithPause',
      newLocation: { addressableAreaName: 'gripperWasteChute' },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'GRIPPER_REQUIRED',
    })
  })
  it('should return an error when trying to move a labware with the gripper when a pipette has a tip on it still', () => {
    const robotStateWithTipOnPip = {
      ...robotState,
      tipState: {
        tipracks: {
          tiprack1Id: { A1: true },
        },
        pipettes: {
          p10SingleId: {
            hasTip: true,
            tiprackURI: 'tiprackId',
          },
        },
      },
    } as any as RobotState

    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { addressableAreaName: 'gripperWasteChute' },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotStateWithTipOnPip)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'PIPETTE_HAS_TIP',
    })
  })

  it('should return a move_lid command when moving a lid from a stack to a stack', () => {
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        ...invariantContext.labwareEntities,
        [SOURCE_LABWARE]: {
          ...invariantContext.labwareEntities[SOURCE_LABWARE],
          def: {
            ...invariantContext.labwareEntities[SOURCE_LABWARE].def,
            allowedRoles: ['lid'],
            compatibleParentLabware: ['fixture_96_plate'],
            stackLimit: 4,
          } as LabwareDefinition2,
        },
        stackingLabware: {
          def: {
            ...invariantContext.labwareEntities[SOURCE_LABWARE].def,
            allowedRoles: ['lid'],
            stackLimit: 4,
          } as LabwareDefinition2,
        } as any,
      },
    } as InvariantContext

    robotState = {
      ...robotState,
      labware: {
        ...robotState.labware,
        [SOURCE_LABWARE]: {
          ...robotState.labware[SOURCE_LABWARE],
          stack: [SOURCE_LABWARE, 'A2'],
        },
        stackingLabware: {
          stack: ['stackingLabware', 'A1'],
        },
      },
    }

    const params = {
      labwareId: SOURCE_LABWARE,
      newLocation: { slotName: 'A1' },
      strategy: 'usingGripper',
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_lid("A2", "A1", use_gripper=True)`
    )
  })

  it('should error with the stack too high error', () => {
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        ...invariantContext.labwareEntities,
        [SOURCE_LABWARE]: {
          ...invariantContext.labwareEntities[SOURCE_LABWARE],
          def: {
            ...invariantContext.labwareEntities[SOURCE_LABWARE].def,
            allowedRoles: ['lid'],
            compatibleParentLabware: ['fixture_96_plate'],
            stackLimit: 4,
          } as LabwareDefinition2,
        },
        stackingLabware: {
          def: {
            ...invariantContext.labwareEntities[SOURCE_LABWARE].def,
            allowedRoles: ['lid'],
          } as LabwareDefinition2,
        } as any,
      },
    } as InvariantContext

    robotState = {
      ...robotState,
      labware: {
        ...robotState.labware,
        [SOURCE_LABWARE]: {
          ...robotState.labware[SOURCE_LABWARE],
          stack: [SOURCE_LABWARE, 'A2'],
        },
        stackingLabware: {
          stack: ['stackingLabware', 'A1'],
        },
      },
    }

    const params = {
      labwareId: SOURCE_LABWARE,
      newLocation: { slotName: 'A1' },
      strategy: 'usingGripper',
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    const { errors } = getErrorResult(result)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({
      type: 'STACK_TOO_HIGH',
    })
  })

  it('should return a move_lid command when moving a lid from a stack to a slot', () => {
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        ...invariantContext.labwareEntities,
        [SOURCE_LABWARE]: {
          ...invariantContext.labwareEntities[SOURCE_LABWARE],
          def: {
            ...invariantContext.labwareEntities[SOURCE_LABWARE].def,
            allowedRoles: ['lid'],
          } as LabwareDefinition2,
        },
      },
    } as InvariantContext

    robotState = {
      ...robotState,
      labware: {
        ...robotState.labware,
        [SOURCE_LABWARE]: {
          ...robotState.labware[SOURCE_LABWARE],
          stack: [SOURCE_LABWARE, 'A2'],
        },
      },
    }

    const params = {
      labwareId: SOURCE_LABWARE,
      newLocation: { slotName: 'A1' },
      strategy: 'usingGripper',
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_lid("A2", "A1", use_gripper=True)`
    )
  })

  it('should return a move_lid command when moving a lid from a labware to a slot', () => {
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        ...invariantContext.labwareEntities,
        [SOURCE_LABWARE]: {
          ...invariantContext.labwareEntities[SOURCE_LABWARE],
          def: {
            ...invariantContext.labwareEntities[SOURCE_LABWARE].def,
            allowedRoles: ['lid'],
          } as LabwareDefinition2,
        },
        stackingLabware: {
          def: {
            ...fixture12Trough,
          } as LabwareDefinition2,
          pythonName: 'stacking_labware',
        } as any,
      },
    } as InvariantContext

    robotState = {
      ...robotState,
      labware: {
        ...robotState.labware,
        stackingLabware: {
          stack: ['stackingLabware', '1'],
        },
        [SOURCE_LABWARE]: {
          ...robotState.labware[SOURCE_LABWARE],
          stack: [SOURCE_LABWARE, 'stackingLabware', 'A2'],
        },
      },
    }

    const params = {
      labwareId: SOURCE_LABWARE,
      newLocation: { slotName: 'A1' },
      strategy: 'usingGripper',
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_lid(stacking_labware, "A1", use_gripper=True)`
    )
  })

  it('should return a move_lid command when moving a lid from a stack to a compatible labware', () => {
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        ...invariantContext.labwareEntities,
        [SOURCE_LABWARE]: {
          ...invariantContext.labwareEntities[SOURCE_LABWARE],
          def: {
            ...invariantContext.labwareEntities[SOURCE_LABWARE].def,
            allowedRoles: ['lid'],
            compatibleParentLabware: ['fixture_12_trough'],
          } as LabwareDefinition2,
        },
        stackingLabware: {
          def: {
            ...fixture12Trough,
          } as LabwareDefinition2,
          pythonName: 'stacking_labware',
        } as any,
      },
    } as InvariantContext

    robotState = {
      ...robotState,
      labware: {
        ...robotState.labware,
        stackingLabware: {
          stack: ['stackingLabware', 'A1'],
        },
        [SOURCE_LABWARE]: {
          ...robotState.labware[SOURCE_LABWARE],
          stack: [SOURCE_LABWARE, 'A2'],
        },
      },
    }

    const params = {
      labwareId: SOURCE_LABWARE,
      newLocation: { labwareId: 'stackingLabware' },
      strategy: 'usingGripper',
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getSuccessResult(result).python).toBe(
      `protocol.move_lid("A2", stacking_labware, use_gripper=True)`
    )
  })

  it('should return an error when moving a lid from a stack to an incompatible labware', () => {
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        ...invariantContext.labwareEntities,
        [SOURCE_LABWARE]: {
          ...invariantContext.labwareEntities[SOURCE_LABWARE],
          def: {
            ...invariantContext.labwareEntities[SOURCE_LABWARE].def,
            allowedRoles: ['lid'],
          } as LabwareDefinition2,
        },
        stackingLabware: {
          def: {
            ...fixture12Trough,
          } as LabwareDefinition2,
          pythonName: 'stacking_labware',
        } as any,
      },
    } as InvariantContext

    robotState = {
      ...robotState,
      labware: {
        ...robotState.labware,
        stackingLabware: {
          stack: ['stackingLabware', 'A1'],
        },
        [SOURCE_LABWARE]: {
          ...robotState.labware[SOURCE_LABWARE],
          stack: [SOURCE_LABWARE, 'A2'],
        },
      },
    }

    const params = {
      labwareId: SOURCE_LABWARE,
      newLocation: { labwareId: 'stackingLabware' },
      strategy: 'usingGripper',
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    const { errors } = getErrorResult(result)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({
      type: 'LABWARE_ON_ANOTHER_ENTITY',
    })
  })
  it('should return an error when trying to move a tiprack lid to a slot', () => {
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        ...invariantContext.labwareEntities,
        [SOURCE_LABWARE]: {
          ...invariantContext.labwareEntities[SOURCE_LABWARE],
          def: {
            ...invariantContext.labwareEntities[SOURCE_LABWARE].def,
            parameters: { loadName: TIPRACK_LID_LOADNAME } as any,
            allowedRoles: ['lid'],
          } as LabwareDefinition2,
        },
      },
    } as InvariantContext

    const params = {
      labwareId: SOURCE_LABWARE,
      newLocation: { slotName: 'A1' },
      strategy: 'manualMoveWithPause',
    } as MoveLabwareParams
    const result = moveLabware(params, invariantContext, robotState)
    const { errors } = getErrorResult(result)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({
      type: 'TIPRACK_LID_NOT_ALLOWED_ON_DECK',
    })
  })
  it('should return an error when trying to move a tiprack lid to a staging area', () => {
    invariantContext = {
      ...invariantContext,
      labwareEntities: {
        ...invariantContext.labwareEntities,
        [SOURCE_LABWARE]: {
          ...invariantContext.labwareEntities[SOURCE_LABWARE],
          def: {
            ...invariantContext.labwareEntities[SOURCE_LABWARE].def,
            parameters: { loadName: TIPRACK_LID_LOADNAME } as any,
            allowedRoles: ['lid'],
          } as LabwareDefinition2,
        },
      },
    } as InvariantContext

    const params = {
      labwareId: SOURCE_LABWARE,
      newLocation: { addressableAreaName: 'A4' },
      strategy: 'manualMoveWithPause',
    } as MoveLabwareParams
    const result = moveLabware(params, invariantContext, robotState)
    const { errors } = getErrorResult(result)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatchObject({
      type: 'TIPRACK_LID_NOT_ALLOWED_ON_DECK',
    })
  })
  it('should return an error when trying to move labware to a vacuum module while active', () => {
    const VACUUM_MODULE_ID = 'vacuumModuleId'
    const VACUUM_MODULE_SLOT = 'B1'

    invariantContext = {
      ...invariantContext,
      moduleEntities: {
        [VACUUM_MODULE_ID]: {
          id: VACUUM_MODULE_ID,
          type: VACUUM_MODULE_TYPE,
          model: VACUUM_MODULE_V1,
          pythonName: 'mock_vacuum_module',
        },
      },
    }

    robotState = {
      ...robotState,
      modules: {
        ...robotState.modules,
        [VACUUM_MODULE_ID]: {
          slot: VACUUM_MODULE_SLOT,
          moduleState: {
            type: VACUUM_MODULE_TYPE,
            ventStatus: null,
            numPumpActivitiesStarted: 1,
            currentPumpActivity: {
              type: 'indefiniteHold',
              mode: 'pressure',
              targetPressure: 10,
            },
          },
        } as any,
      },
    }

    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { moduleId: VACUUM_MODULE_ID },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'VACUUM_UNDER_PRESSURE',
    })
  })
  it('should return an error when trying to move labware from a vacuum module while active', () => {
    const VACUUM_MODULE_ID = 'vacuumModuleId'
    const VACUUM_MODULE_SLOT = 'B1'

    invariantContext = {
      ...invariantContext,
      moduleEntities: {
        [VACUUM_MODULE_ID]: {
          id: VACUUM_MODULE_ID,
          type: VACUUM_MODULE_TYPE,
          model: VACUUM_MODULE_V1,
          pythonName: 'mock_vacuum_module',
        },
      },
    }

    robotState = {
      ...robotState,
      labware: {
        ...robotState.labware,
        [SOURCE_LABWARE]: {
          stack: [SOURCE_LABWARE, VACUUM_MODULE_ID, VACUUM_MODULE_SLOT],
        },
      },
      modules: {
        ...robotState.modules,
        [VACUUM_MODULE_ID]: {
          slot: VACUUM_MODULE_SLOT,
          moduleState: {
            type: VACUUM_MODULE_TYPE,
            ventStatus: null,
            numPumpActivitiesStarted: 1,
            currentPumpActivity: {
              type: 'indefiniteHold',
              mode: 'pressure',
              targetPressure: 10,
            },
          },
        } as any,
      },
    }

    const params = {
      labwareId: SOURCE_LABWARE,
      strategy: 'usingGripper',
      newLocation: { slotName: 'A1' },
    } as MoveLabwareParams

    const result = moveLabware(params, invariantContext, robotState)
    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'VACUUM_UNDER_PRESSURE',
    })
  })
})
