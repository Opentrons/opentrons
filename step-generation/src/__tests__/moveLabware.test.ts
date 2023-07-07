import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'
import {
  getInitialRobotStateStandard,
  getInitialRobotStateWithOffDeckLabwareStandard,
  makeContext,
  getSuccessResult,
  getErrorResult,
  getStateAndContextTempTCModules,
  SOURCE_LABWARE,
} from '../fixtures'
import { moveLabware, MoveLabwareArgs } from '..'

import type { InvariantContext, RobotState } from '../types'

describe('moveLabware', () => {
  let robotState: RobotState
  let invariantContext: InvariantContext
  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)
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
      useGripper: true,
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
})
